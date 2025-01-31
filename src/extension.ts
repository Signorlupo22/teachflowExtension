// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import WebSocket from 'ws';
import { WebSocketServer } from "ws";
import { decodeResponse } from './webSocket/webScocketServer';

let wss: WebSocket.Server | null = null;

// Questa funzione viene chiamata quando l'estensione è attivata
export function activate(context: vscode.ExtensionContext) {

	const startSession = () => {
		vscode.window.showInformationMessage('Starting session from TeachflowLocal!');
		startWebSocketServer(9182, context);
	};

	// Controlla se l'avvio automatico è abilitato
	const config = vscode.workspace.getConfiguration('teachflow');
	if (config.get('autoStartSession')) {
		startSession();
	}


	const startCommand = vscode.commands.registerCommand('teachflow.startsession', startSession);
	context.subscriptions.push(startCommand);

	context.subscriptions.push({
		dispose: () => stopWebSocketServer(),
	});
	// Assicura che il server venga chiuso quando l'estensione viene disattivata


	const sendMessage = vscode.commands.registerCommand('teachflow.sendTestMessage', () => {
		const message = { type: 'test', message: 'Hello from Teachflow!' };
		if (wss) {
			wss.clients.forEach((client) => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify(message));
				}
			});
		}
	}
	);

	context.subscriptions.push(sendMessage);

	// Registra un comando per abilitare/disabilitare l'avvio automatico
	const toggleAutoStart = vscode.commands.registerCommand('teachflow.toggleAutoStart', async () => {
		const currentValue = config.get('autoStartSession', false);
		const newValue = !currentValue;
		await config.update('autoStartSession', newValue, vscode.ConfigurationTarget.Global);
		vscode.window.showInformationMessage(
			`Auto start session is now ${newValue ? 'enabled' : 'disabled'}.`
		);
	});
	context.subscriptions.push(toggleAutoStart);
	
}

// Questa funzione viene chiamata quando l'estensione è disattivata
export function deactivate() {
	stopWebSocketServer();
}

// Funzione per avviare il server WebSocket
function startWebSocketServer(port: number, context: vscode.ExtensionContext) {
	if (wss) {
		console.log('WebSocket server is already running');
		return;
	}
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage(
            "Teachflow: No workspace is opened."
        );
        return;
    }

	const currentDir = workspaceFolders[0].uri.fsPath;

	wss = new WebSocketServer( { port });

	wss.on('connection', (ws : any, req: any) => {
		console.log('Browser connected to WebSocket server!');

		const origin = req.headers.origin;

		console.log(`Origin: ${origin}`);
		
		if (origin !== "https://teachflow.app") {
			console.log(`Connection rejected from origin: ${origin}`);
			ws.close(); // Chiude immediatamente la connessione
			return;
		}
	

		ws.on('message', async (message : any) => {
			console.log(`Received: ${message}`);
			var res = await decodeResponse(message, currentDir);
			console.log(`Sending: ${JSON.stringify(res)}`);
			ws.send(JSON.stringify(res));
		});

		ws.on('close', () => {
			console.log('Browser disconnected');
		});
	});

	console.log(`WebSocket server running on ws://localhost:${port}`);
}

// Funzione per fermare il server WebSocket
function stopWebSocketServer() {
	if (wss) {
		wss.close(() => {
			console.log('WebSocket server stopped');
		});
		wss = null;
	}
}