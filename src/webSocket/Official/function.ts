import * as vscode from 'vscode';
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { createFileJson, ExecCodeJson, gitCloneJson, highlightCodeJson, insertCodeJson, removeCodeJson } from '../../interface/ws';

/// Function to clone a git repository
/// @param json: json object with the url of the repository
/// @param currentDir: the directory where the repository will be cloned
/// @returns void
/// the structor of the json object is:
/// {
///    "type": "gitclone"
///     "url": "github ulr","
/// }
export function gitClone(json: gitCloneJson, currentDir: string): Promise<{ type: string, status: string, message?: string }> {
    return new Promise((resolve, reject) => {
        var parsedUrl = new URL(json.url);
        exec(
            //TODO parse this for avoid command injection

            `git clone ${parsedUrl} .`,
            { cwd: currentDir },
            (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`error: ${error.message}`);
                    reject({ type: "gitClone", status: "error", message: error.message });
                    return;
                }
                if (stderr) {
                    vscode.window.showInformationMessage(`error: ${stderr}`);
                    resolve({ type: "gitClone", status: "error", message: stderr });
                    return { type: "gitClone", status: "error", message: stderr };
                }
                vscode.window.showInformationMessage(`stdout: ${stdout}`);
                resolve({ type: "gitClone", status: "ok", message: stdout });
                return { type: "gitClone", status: "ok", message: stdout };
            }
        );
    });
}
/// Function to insert code in a file
/// @param json: json object with the file path, the string to search and the code to insert
/// @param currentDir: the directory where the file is located
/// @returns void
/// the structor of the json object is:
/// {
///    "type": "insertcode"
///     "file": "file path",
///     "searchString": "string to search",
///     "code": "code to insert"
/// }
export function insertCode(json: insertCodeJson, currentDir: string) {
    return new Promise((resolve, reject) => {
        const searchString = json.searchString; // Stringa da cercare
        const filePath = path.join(currentDir, json.file);
        const fileUri = vscode.Uri.file(filePath);

        vscode.workspace.openTextDocument(fileUri).then(
            (document) => {
                const text = document.getText();
                const lines = text.split("\n");
                let line = -1;

                // Cerca la stringa nel documento
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(searchString)) {
                        line = i + 1; // Inserisce subito dopo la riga trovata
                        break;
                    }
                }

                if (line !== -1) {
                    vscode.window.showTextDocument(document).then((editor) => {
                        const position = new vscode.Position(line, 0);

                        // Creazione della decorazione per evidenziare il testo
                        const decorationType =
                            vscode.window.createTextEditorDecorationType({
                                backgroundColor: "rgba(0, 255, 0, 0.3)", // Verde semi-trasparente
                            });

                        editor
                            .edit((editBuilder) => {
                                editBuilder.insert(position, `\n${json.code}`);
                            })
                            .then((success) => {
                                if (success) {
                                    vscode.window.showInformationMessage(
                                        `Codice inserito in ${json.file} dopo la stringa "${searchString}"`
                                    );

                                    const startPos = position;
                                    const endPos = new vscode.Position(
                                        startPos.line +
                                        json.code.split("\n").length -
                                        1,
                                        json.code.split("\n").slice(-1)[0].length
                                    );
                                    const range = new vscode.Range(
                                        startPos,
                                        endPos
                                    );

                                    editor.setDecorations(decorationType, [range]);

                                    setTimeout(() => {
                                        editor.setDecorations(decorationType, []);
                                    }, 2000);


                                    resolve({ type: "insertCode", status: "ok", message: `Code inserted in ${json.file} after the string "${searchString}"` });
                                } else {
                                    vscode.window.showErrorMessage(
                                        "Error during code insertion"
                                    );
                                    reject({ type: "insertCode", status: "error", message: "Error during code insertion" });
                                    return { type: "insertCode", status: "error", message: "Error during code insertion" };
                                }
                            });
                    });
                } else {
                    vscode.window.showErrorMessage(
                        `"${searchString}" not found.`
                    );
                    resolve({ type: "insertCode", status: "error", message: `"${searchString}" not found.` });
                    return { type: "insertCode", status: "error", message: `"${searchString}" not found.` };
                }
            },
            (error) => {
                vscode.window.showErrorMessage(
                    `Error open the file: ${error.message}`
                );
                reject({ type: "insertCode", status: "error", message: `Error open the file: ${error.message}` });
            }
        );

        // resolve({ type: "insertCode", status: "ok", message: `Code inserted in ${json.file} after the string "${searchString}"` });
    });
    
}
/// Function to remove code from a file
/// @param json: json object with the file path and the code to remove
/// @param currentDir: the directory where the file is located
/// @returns void
/// the structor of the json object is:
/// {
///    "type": "removecode"
///     "file": "file path",
///     "code": "code to remove"
/// }
export function removeCode(json: removeCodeJson, currentDir: string) {
    return new Promise((resolve, reject) => {
        const removeFilePath = path.join(currentDir, json.file);
        const removeFileUri = vscode.Uri.file(removeFilePath);

        vscode.workspace.openTextDocument(removeFileUri).then(
            (document) => {
                vscode.window.showTextDocument(document).then((editor) => {
                    const codeToRemove = json.code.split("\n"); // Codice da rimuovere, diviso per linee
                    const text = document.getText();
                    const lines = text.split("\n");
                    let found = false;

                    const rangesToDelete: vscode.Range[] = []; // Raccogliamo tutti i range da cancellare

                    codeToRemove.forEach((codeLine) => {
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            const index = line.indexOf(codeLine);

                            if (index !== -1) {
                                found = true;
                                const startPosition = new vscode.Position(i, index);
                                const endPosition = new vscode.Position(
                                    i,
                                    index + codeLine.length
                                );
                                const range = new vscode.Range(
                                    startPosition,
                                    endPosition
                                );

                                // Creazione della decorazione per evidenziare il testo da rimuovere
                                const decorationType =
                                    vscode.window.createTextEditorDecorationType({
                                        backgroundColor: "rgba(255, 0, 0, 0.3)", // Rosso semi-trasparente
                                    });

                                editor.setDecorations(decorationType, [range]);
                                rangesToDelete.push(range); // Aggiungiamo il range alla lista
                            }
                        }
                    });

                    // Rimozione delle decorazioni e delle linee dopo 2 secondi
                    setTimeout(() => {
                        if (rangesToDelete.length > 0) {
                            editor.setDecorations(
                                vscode.window.createTextEditorDecorationType({}),
                                []
                            ); // Rimozione decorazione

                            editor
                                .edit((editBuilder) => {
                                    rangesToDelete.forEach((range) => {
                                        editBuilder.delete(range);
                                    });
                                })
                                .then((success) => {
                                    if (success) {
                                        vscode.window.showInformationMessage(
                                            `Code remove from ${json.file}`
                                        );
                                        resolve({ type: "removeCode", status: "ok", message: `Code removed from ${json.file}` });
                                        return { type: "removeCode", status: "ok", message: `Code removed from ${json.file}` };
                                    } else {
                                        vscode.window.showErrorMessage(
                                            "Error during code removal"
                                        );
                                        reject({ type: "removeCode", status: "error", message: "Error during code removal" });
                                        return { type: "removeCode", status: "error", message: "Error during code removal" };
                                    }
                                });
                        } else {
                            vscode.window.showErrorMessage(
                                `Code in ${json.file} not found.`
                            );
                            resolve({ type: "removeCode", status: "error", message: `Code in ${json.file} not found.` });
                            return { type: "removeCode", status: "error", message: `Code in ${json.file} not found.` };
                        }
                    }, 2000);
                });
            },
            (error) => {
                vscode.window.showErrorMessage(
                    `Error when opening file: ${error.message}`
                );
                reject({ type: "removeCode", status: "error", message: `Error when opening file ${error.message}` });
                return { type: "removeCode", status: "error", message: `Error when opening file ${error.message}` };
            }
        );
    });
}

/// Function to create a file
/// @param json: json object with the file path and the content
/// @param currentDir: the directory where the file will be created
/// @returns void
/// the structor of the json object is:
/// {
///    "type": "createfile"
///     "file": "file path",
///     "content": "file content"
/// }
export function createFile(json: createFileJson, currentDir: string) {
    return new Promise((resolve, reject) => {
        const createFilePath = path.join(currentDir, json.file);
        const dirPath = path.dirname(createFilePath);

        // Crea le directory se non esistono
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        if (fs.existsSync(createFilePath)) {
            vscode.window.showErrorMessage(
                `${json.file} already exists`
            );
            reject({ type: "createFile", status: "error", message: `${json.file} already exists` });
            return { type: "createFile", status: "error", message: `${json.file} already exists` };
        }

        fs.writeFileSync(createFilePath, json.content || "", "utf8");

        // Mostra un messaggio di successo
        vscode.window.showInformationMessage(
            `File ${json.file} creato con successo.`
        );

        // Apri il file nell'editor
        const fileUri2 = vscode.Uri.file(createFilePath);
        vscode.workspace.openTextDocument(fileUri2).then(
            (document) => {
                vscode.window.showTextDocument(document).then((editor) => {
                    editor.document.save().then(() => {
                        resolve({ type: "createFile", status: "ok", message: `File ${json.file} Created and saved.` });
                    });
                });
            },
            (error) => {
                vscode.window.showErrorMessage(
                    `Error opening file: ${error.message}`
                );

                reject({ type: "createFile", status: "error", message: `Error opening file: ${error.message}` });
                return { type: "createFile", status: "error", message: `Error opening file: ${error.message}` };
            }
        );
    });
}


/// Function to highlight code in a file
/// @param json: json object with the file path and the code to highlight
/// @param currentDir: the directory where the file is located
/// @returns void
/// the structor of the json object is:
/// {
///    "type": "highlightcode"
///     "file": "file path",
///     "code": "code to highlight"
///     "tooltip": "tooltip message"
/// }
export function highlightCode(json: highlightCodeJson, currentDir: string) {
    return new Promise((resolve, reject) => {
        const highlightFilePath = path.join(currentDir, json.file);

        if (!fs.existsSync(highlightFilePath)) {
            vscode.window.showErrorMessage(
                `File non trovato: ${json.file}`
            );
            return;
        }

        const highlightFileUri = vscode.Uri.file(highlightFilePath);

        vscode.workspace.openTextDocument(highlightFileUri).then(
            (document) => {
                vscode.window.showTextDocument(document).then((editor) => {
                    const documentText = document.getText();
                    const startIndex = documentText.indexOf(json.code);

                    if (startIndex === -1) {
                        vscode.window.showErrorMessage(
                            `Code not found: ${json.code}`
                        );
                        reject({ type: "highlightCode", status: "error", message: `Code not found: ${json.code}` });
                        return { type: "highlightCode", status: "error", message: `Code not found: ${json.code}` };
                    }

                    const startPosition = document.positionAt(startIndex);
                    const endPosition = document.positionAt(
                        startIndex + json.code.length
                    );
                    const range = new vscode.Range(
                        startPosition,
                        endPosition
                    );

                    // Seleziona e evidenzia il testo
                    editor.selection = new vscode.Selection(
                        startPosition,
                        endPosition
                    );
                    editor.revealRange(
                        range,
                        vscode.TextEditorRevealType.InCenter
                    );

                    // Aggiungi un hover provider per visualizzare il tooltip
                    const hoverProvider =
                        vscode.languages.registerHoverProvider(
                            {
                                scheme: "file",
                                language: "javascript",
                            },
                            {
                                provideHover: (document, position) => {
                                    if (range.contains(position)) {
                                        return new vscode.Hover(
                                            json.tooltip
                                        );
                                    }
                                },
                            }
                        );

                    // Mostra il tooltip subito dopo aver evidenziato
                    vscode.commands.executeCommand(
                        "editor.action.showHover"
                    );

                    // Registra il provider temporaneamente
                    const disposable =
                        vscode.Disposable.from(hoverProvider);

                    // Rimuovi il provider dopo 10 secondi (o a piacere)
                    setTimeout(() => {
                        disposable.dispose();
                    }, 10000);

                    resolve({ type: "highlightCode", status: "ok", message: `Code highlighted: ${json.code}` });
                    return { type: "highlightCode", status: "ok", message: `Code highlighted: ${json.code}` };
                });
            },
            (error) => {
                vscode.window.showErrorMessage(
                    `Errore nell'aprire il file: ${error.message}`
                );

                reject({ type: "highlightCode", status: "error", message: `Errore nell'aprire il file: ${error.message}` });
                return { type: "highlightCode", status: "error", message: `Errore nell'aprire il file: ${error.message}` };
            }
        );
    });
}


export function execCode(json: ExecCodeJson, currentDir: string): Promise<{ type: string, status: string, message?: string }> {
    return new Promise((resolve, reject) => {
        const terminal = vscode.window.createTerminal({ cwd: currentDir });
        console.log(json.content);
        terminal.sendText(json.content);
        
        terminal.show();
        resolve({ type: "ExecCode", status: "ok", message: "Code executed in terminal" });
        // Aspetta un breve periodo per assicurarti che il terminale sia pronto
    });
}