import * as vscode from 'vscode';
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { createFileJson, gitCloneJson, highlightCodeJson, insertCodeJson, removeCodeJson } from '../../interface/ws';

/// Function to clone a git repository
/// @param json: json object with the url of the repository
/// @param currentDir: the directory where the repository will be cloned
/// @returns void
/// the structor of the json object is:
/// {
///    "type": "gitclone"
///     "url": "github ulr","
/// }
export function gitClone(json : gitCloneJson , currentDir : string) {
    exec(
        //TODO parse this for avoid command injection
        `git clone ${json.url} .`,
        { cwd: currentDir },
        (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Errore: ${error.message}`);
                return;
            }
            if (stderr) {
                vscode.window.showErrorMessage(`stderr: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`stdout: ${stdout}`);
        }
    );
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
export function insertCode(json : insertCodeJson, currentDir: string) {
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
                            } else {
                                vscode.window.showErrorMessage(
                                    "Errore durante l'inserimento del codice."
                                );
                            }
                        });
                });
            } else {
                vscode.window.showErrorMessage(
                    `Stringa "${searchString}" non trovata nel file.`
                );
            }
        },
        (error) => {
            vscode.window.showErrorMessage(
                `Errore nell'aprire il file: ${error.message}`
            );
        }
    );
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
export function removeCode(json : removeCodeJson, currentDir: string) {
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
                                        `Codice rimosso da ${json.file}`
                                    );
                                } else {
                                    vscode.window.showErrorMessage(
                                        "Errore durante la rimozione del codice."
                                    );
                                }
                            });
                    } else {
                        vscode.window.showErrorMessage(
                            `Il codice specificato non è stato trovato in ${json.file}.`
                        );
                    }
                }, 2000);
            });
        },
        (error) => {
            vscode.window.showErrorMessage(
                `Errore nell'aprire il file: ${error.message}`
            );
        }
    );
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
export function createFile(json : createFileJson, currentDir: string) {
    const createFilePath = path.join(currentDir, json.file);
    const dirPath = path.dirname(createFilePath);

    // Crea le directory se non esistono
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    if (fs.existsSync(createFilePath)) {
        vscode.window.showErrorMessage(
            `Il file ${json.file} esiste già.`
        );
        return;
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
            vscode.window.showTextDocument(document);
        },
        (error) => {
            vscode.window.showErrorMessage(
                `Errore nell'aprire il file: ${error.message}`
            );
        }
    );

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
export function highlightCode(json : highlightCodeJson, currentDir: string) {
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
                        `Codice non trovato nel file: ${json.code}`
                    );
                    return;
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
            });
        },
        (error) => {
            vscode.window.showErrorMessage(
                `Errore nell'aprire il file: ${error.message}`
            );
        }
    );
}


