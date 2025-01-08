# Teachflow VS Code Extension

# Get started

1. Open the command palette
2. type start Session
3. copy the code from the course/Demo
4. enjoy

rember to start the session in a blank folder or the git clone wont work

## Overview

The **Teachflow VS Code Extension** is a powerful tool designed to enhance your development workflow within Visual Studio Code by allowing you to interact with a specific remote service. The extension integrates with the remote service hosted at `https://teachflow.app`, enabling you to perform various operations such as code insertion, code removal, file creation, and more directly from within VS Code.

## Features

- **Start Authentication Session**: Begin a session by authenticating with the `https://teachflow.app` service.
- **WebSocket Integration**: Establish a WebSocket connection to receive real-time commands from the `https://teachflow.app` service.
- **Code Insertion**: Automatically insert code into specified files at locations based on search strings.
- **Code Removal**: Remove specific code snippets from files, preserving indentation and surrounding content.
- **File Creation**: Create new files and folders with specified content.
- **Code Highlighting**: Highlight specific code segments and display tooltips.


## Usage

### 1. Start Authentication Session

- **Command**: `Teachflow.startSession`
- **Description**: Initiates an authentication session by prompting the user to enter a code. The extension opens a browser window to complete the authentication process with `https://teachflow.app`. Upon successful authentication, the extension will connect to a WebSocket server at `https://teachflow.app`.

### 2. WebSocket Connection

- Once authenticated, the extension establishes a WebSocket connection specifically with `https://teachflow.app` to receive commands remotely. Supported commands include:
  - **gitClone**: Clones a repository into the current workspace.
  - **insertCode**: Inserts specified code at a location in a file based on a search string.
  - **removeCode**: Removes specified code from a file, keeping the indentation intact.
  - **createFile**: Creates a new file or directory with the given content.
  - **highlightCode**: Highlights a specific code segment in a file and shows a tooltip.

### 3. Insert Code

- **Command**: `insertCode`
- **Parameters**:
  - `file`: The target file where the code will be inserted.
  - `searchString`: A string used to locate where the code should be inserted.
  - `code`: The code snippet to insert.
- **Behavior**: The code is inserted immediately after the line containing the `searchString`. The inserted code is highlighted temporarily.

### 4. Remove Code

- **Command**: `removeCode`
- **Parameters**:
  - `file`: The target file from which the code will be removed.
  - `code`: The code snippet to remove.
- **Behavior**: The specified code is removed from the file, line by line, preserving the indentation and other content on those lines. The removed code is highlighted temporarily before deletion.

### 5. Create File

- **Command**: `createFile`
- **Parameters**:
  - `file`: The path of the file to be created.
  - `content`: The content to write into the new file.
- **Behavior**: Creates the file at the specified location, including any necessary directories. If the file already exists, an error message is shown.

### 6. Highlight Code

- **Command**: `highlightCode`
- **Parameters**:
  - `file`: The target file containing the code to highlight.
  - `code`: The code snippet to highlight.
  - `tooltip`: The text to display in the tooltip.
- **Behavior**: Highlights the specified code and shows a tooltip with the provided text.

## Development

To modify or extend the functionality of this extension:

1. Open the project in VS Code.
2. Modify the `src/functions.js` to add more function
3. add into the switch in `src/websocket.js`
4. Press `F5` to test your changes in a new VS Code window.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue to suggest improvements or create new intergration.

## License

This project is licensed under the MIT License.
