import {
  commands,
  Uri,
  ExtensionContext,
  window,
  Range,
} from "vscode";
import { join } from "path";
import { alias, gitHubID, learnRepoId } from "./userSettings";

const replace = require("replace-in-file");
const fse = require("fs-extra");

export let repoName: string;
export let extensionPath: string;
export let templateFolder: any;
export let moduleName: string;
export let scaffoldModule: string;
let learnRepo: string = learnRepoId;
let author: string = gitHubID;
let msAuthor: string = alias;

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

  context.subscriptions.push(
    disposableGetFolder,
    disposableMoveUp,
    disposableMoveDown
  );
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
    moduleName = moduleName.replace(/ /g, "-");

    scaffoldModule = join(selectedFolder, moduleName);
    fse.copy(templateFolder, scaffoldModule, (err: any) => {
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
    files: `${modulePath}/*.yml`,
    from: /{{moduleName}}/g,
    to: moduleName,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameRepoReferences(scaffoldModule, moduleName);
}

function renameRepoReferences(modulePath: string, moduleName: any) {
  if (!learnRepo) {
    learnRepo = "learn";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{learRepo}}/g,
    to: learnRepo,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameGithIDReferences(scaffoldModule, moduleName);
}

function renameGithIDReferences(modulePath: string, moduleName: any) {
  if (!author) {
    author = "{{github}}";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{github}}/g,
    to: author,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameGithAuthorReferences(scaffoldModule);
}

function renameGithAuthorReferences(modulePath: string) {
  if (!msAuthor) {
    msAuthor = "{{msuser}}";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{msuser}}/g,
    to: msAuthor,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
}

function moveSelectionDown() {
  commands.executeCommand("editor.action.moveLinesDownAction");
  commands.executeCommand("cursorLineStart");
  const editor = window.activeTextEditor;
  if (editor) {
    const range = new Range(
      editor.selection.active.line,
      0,
      editor.selection.active.line,
      1000
    );
    try {
      const lineText = editor.document.getText(range);
      // get current unit path (use for renames)
      let currentUnitPath = lineText.replace("- ", "").split(".");
      // get current unit name
      let currentUnitName = currentUnitPath.slice(-1).pop();

      // get current unit number
      let currentUnitNumber: any = currentUnitName?.charAt(0);
      currentUnitNumber = currentUnitNumber.trim();

      // get updated unit number
      let num: any = parseInt(currentUnitNumber);
      var newUnitNumber = num + 1;

      // get update unit name
      const unitReplaceRegex = new RegExp(num);
      let newUnitName = currentUnitName?.replace(
        unitReplaceRegex,
        newUnitNumber
      );

      const newLinePosition: any = editor.selection.active;
      editor.edit((update) => {
        update.insert(newLinePosition, newUnitName!);
      });

      // let moduleDirectory: any = parse(editor.document.fileName!).dir;
      /*       const options = {
        files: `${moduleDirectory}/index.yml`,
        from: currentUnitName,
        to: newUnitName,
      };
      const results = replace.sync(options);
      console.log("Replacement results:", results);
      editor.document.save(); */
    } catch (error) {
      console.log(error);
    }
  }
}

function moveSelectionUp() {
  commands.executeCommand("editor.action.moveLinesUpAction");
}
