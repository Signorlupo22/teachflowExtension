import * as vscode from 'vscode';
import WebSocket from 'ws';
import { createFile, gitClone, highlightCode, insertCode, removeCode } from './Official/function';

///all the request from the server are decoded here
/// the json object is parsed and the type of the request is checked
/// if you want to create a new type you have to add a new case in the switch
/// and create a new function in function.js
export async function decodeResponse(data: string, currentDir: string): Promise<any> {
  console.log(`Received: ${data}`);
  const json = JSON.parse(data);

  switch (json.type) {
    case "gitClone":
      try {
        const res = await gitClone(json, currentDir);
        return res;
      } catch (err) {
        return { type: "error", status: "failed", message: err };
      }
    case "insertCode":
      insertCode(json, currentDir);
      return { type: "insertCode", status: "ok", message: "Code inserted" };
    case "removeCode":
      removeCode(json, currentDir);
      return { type: "removeCode", status: "ok" };
    case "createFile":
      createFile(json, currentDir);
      return { type: "createFile", status: "ok" };
    case "highlightCode":
      highlightCode(json, currentDir);
      return { type: "highlightCode", status: "ok" };
    default:
      vscode.window.showErrorMessage("Teachflow: Invalid request type");
      return { type: "error", status: "Invalid request type", message: "Invalid request type" };
      break;
  }
}

