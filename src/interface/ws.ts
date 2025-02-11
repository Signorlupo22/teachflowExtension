export interface WebSocketMessage {
    type: string;
}

export interface gitCloneJson extends WebSocketMessage {
    type: "gitClone";
    url: string;
}

export interface insertCodeJson extends WebSocketMessage {
    type: "insertCode";
    code: string;
    searchString: string;
    file: string;
}

export interface removeCodeJson extends WebSocketMessage {
    type: "removeCode";
    file: string;
    code: string;   
}

export interface createFileJson extends WebSocketMessage {
    type: "createFile";
    file: string;
    content: string;
}

export interface highlightCodeJson extends WebSocketMessage {
    type: "highlightCode";
    code: string;
    file: string;
    tooltip: string;
}

export interface ExecCodeJson extends WebSocketMessage {
    type: "execCode";
    content: string;
}