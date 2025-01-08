import * as vscode from 'vscode';
import WebSocket from 'ws';
import { createFile, gitClone, highlightCode, insertCode, removeCode } from './Official/function';

///all the request from the server are decoded here
/// the json object is parsed and the type of the request is checked
/// if you want to create a new type you have to add a new case in the switch
/// and create a new function in function.js
export function decodeResponse(data: string, currentDir: string) : any {
  console.log(`Received: ${data}`);
  const json = JSON.parse(data);

  switch (json.type) {
    case "gitClone":
      gitClone(json, currentDir);
      return { type: "gitClone", status: "ok" };
    case "insertCode":
      insertCode(json, currentDir);
      return { type: "insertCode", status: "ok" };
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
      break;
  }
}

