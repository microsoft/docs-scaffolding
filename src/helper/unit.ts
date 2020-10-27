import { commands, window, Range } from "vscode";
import { join, parse } from "path";

const fse = require("fs-extra");
const replace = require("replace-in-file");

export function incrementUnitNumber() {
  commands.executeCommand("editor.action.moveLinesDownAction");
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

function renameUnit(
  modulePath: string,
  currentUnitName: string,
  newUnitName: string
) {
  const currentUnitFileName = join(modulePath, `${currentUnitName}.yml`);
  const newUnitFileName = join(modulePath, `${newUnitName}.yml`);
  const currentUnitIncludeFileName = join(
    modulePath,
    "includes",
    `${currentUnitName}.md`
  );
  const newUnitIncludeFileName = join(
    modulePath,
    "includes",
    `${newUnitName}.md`
  );
  fse.rename(currentUnitFileName, newUnitFileName);
  fse.rename(currentUnitIncludeFileName, newUnitIncludeFileName);
}
