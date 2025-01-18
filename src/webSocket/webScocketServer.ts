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

  let res: any;

  switch (json.type) {
    case "gitClone":
      try {
        res = await gitClone(json, currentDir);
        return res;
      } catch (err) {
        return err;
      }
    case "insertCode":
      try {
        res = await insertCode(json, currentDir);
        return res;
      } catch (err) {
        return err;
      }
    case "removeCode":
      try {
        res = await removeCode(json, currentDir);
        return res;
      } catch (err) {
        return err;
      }
    case "createFile":
      try {
        res = await createFile(json, currentDir);
        return res;
      } catch (err) {
        return err;
      }
    case "highlightCode":
      try {
        res = await highlightCode(json, currentDir);
        return res;
      } catch (err) {
        return err;
      }
    default:
      vscode.window.showErrorMessage("Teachflow: Invalid request type");
      return { type: "error", status: "Invalid request type", message: "Invalid request type" };
  }
}

