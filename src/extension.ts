import {
  commands,
  Uri,
  ExtensionContext,
  window,
} from "vscode";
import { join } from "path";
import { alias, gitHubID, learnRepoId } from './userSettings';

export let repoName: string;
export let extensionPath: string;
export let templateFolder: any;
export let moduleName: string;
export let scaffoldModule: string;
let learnRepo: string = learnRepoId;
let author: string = gitHubID;
let msAuthor: string = alias;
const replace = require("replace-in-file");

export async function activate(context: ExtensionContext) {
  const disposableGetFolder = commands.registerCommand(
    "extension.getSelectedFolder",
    async (uri: Uri) => {
      await getSelectedFolder(uri);
    }
  );
  const disposableMoveUp = commands.registerCommand(
    "extension.moveSelectionUp",
    () => {
      moveSelectionUp();
    }
  );
  let disposableMoveDown = commands.registerCommand(
    "extension.moveSelectionDown",
    () => {
      moveSelectionDown();
    }
  );

  context.subscriptions.push(disposableGetFolder,disposableMoveUp, disposableMoveDown);
  extensionPath = context.extensionPath;
  templateFolder = join(extensionPath, "template");
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getSelectedFolder(uri: Uri) {
  const selectedFolder = uri.fsPath;
  const getUserInput = window.showInputBox({
    prompt: "Enter module name.",
    validateInput: (userInput) =>
      userInput.length > 0 ? "" : "Please provide a module name.",
  });
  getUserInput.then((moduleName) => {
    if (!moduleName) {
      return;
    }
    moduleName = moduleName.replace(/ /g, '-');
    const fs = require("fs-extra");
    scaffoldModule = join(selectedFolder, moduleName);
    fs.copy(templateFolder, scaffoldModule, (err: any) => {
      if (err) {
        return console.error(err);
      }
      console.log("success!");
      renameModuleReferences(scaffoldModule, moduleName);
    });
  });
}

function renameModuleReferences(modulePath: string, moduleName: any) {
  const options = {
    files:
      `${modulePath}/*.yml`,
    from: /{{moduleName}}/g,
    to: moduleName,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameRepoReferences(scaffoldModule, moduleName);
}

function renameRepoReferences(modulePath: string, moduleName: any) {
  if (!learnRepo) {
    learnRepo = 'learn';
  }
  const options = {
    files:
      `${modulePath}/*.yml`,
    from: /{{learRepo}}/g,
    to: learnRepo,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameGithIDReferences(scaffoldModule, moduleName);
}

function renameGithIDReferences(modulePath: string, moduleName: any) {
  if (!author) {
    author = '{{github}}';
  }
  const options = {
    files:
      `${modulePath}/*.yml`,
    from: /{{github}}/g,
    to: author,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameGithAuthorReferences(scaffoldModule, moduleName);
}

function renameGithAuthorReferences(modulePath: string, moduleName: any) {
  if (!msAuthor) {
    msAuthor = '{{msuser}}';
  }
  const options = {
    files:
      `${modulePath}/*.yml`,
    from: /{{msuser}}/g,
    to: msAuthor,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
}

function moveSelectionDown() {
  commands.executeCommand("editor.action.moveLinesDownAction");
}

function moveSelectionUp() {
  commands.executeCommand("editor.action.moveLinesUpAction");
}