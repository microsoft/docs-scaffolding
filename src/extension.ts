import { commands, Uri, ExtensionContext, window, Range } from "vscode";
import { join, parse } from "path";
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
  renameGithubIdReferences(scaffoldModule, moduleName);
}

function renameGithubIdReferences(modulePath: string, moduleName: any) {
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
  renameGithubAuthorReferences(scaffoldModule);
}

function renameGithubAuthorReferences(modulePath: string) {
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
  incrementUnitNumber();
}

function moveSelectionUp() {
  commands.executeCommand("editor.action.moveLinesUpAction");
}

function incrementUnitNumber() {
  const editor = window.activeTextEditor;
  if (editor) {
    const range = new Range(
      editor.selection.active.line,
      0,
      editor.selection.active.line,
      1000
    );
    try {
      // get text from current line
      const lineText = editor.document.getText(range);

      // get current unit path (use for renames)
      let currentUnitPath = lineText.replace("- ", "").split(".");
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

      // write updated unit to editor
      const newLineText = lineText.replace(currentUnitName!, newUnitName!);
      editor.edit((update) => {
        update.replace(range, newLineText);
      });
      renameUnitInFiles(currentUnitName!, newUnitName!);
    } catch (error) {
      console.log(error);
    }
  }
}

function renameUnitInFiles(currentUnitName: string, newUnitName: string) {
  const activeFileUri = window.activeTextEditor?.document.fileName;
  let modulePath: any = parse(activeFileUri!);
  modulePath = modulePath.dir;
  const currentInclude = `[!include[](includes/${currentUnitName}.md)]`;
  const newInclude = `[!include[](includes/${newUnitName}.md)]`;
  const options = {
    files: `${modulePath}/*.yml`,
    from: currentInclude,
    to: newInclude,
  };
  const results = replace.sync(options);
  console.log("Replacement results:", results);
  renameUnit(modulePath, currentUnitName, newUnitName);
}

function renameUnit(modulePath: string, currentUnitName: string, newUnitName: string) {
  const currentUnitFileName = join(modulePath, `${currentUnitName}.yml`);
  const newUnitFileName = join(modulePath, `${newUnitName}.yml`);
  const currentUnitIncludeFileName = join(modulePath, 'includes', `${currentUnitName}.md`);
  const newUnitIncludeFileName = join(modulePath, 'includes', `${newUnitName}.md`);
 fse.rename(currentUnitFileName, newUnitFileName);
 fse.rename(currentUnitIncludeFileName, newUnitIncludeFileName);
}