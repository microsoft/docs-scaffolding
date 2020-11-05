import { Uri, window, QuickPickItem, QuickPickOptions } from "vscode";
import { join, resolve } from "path";
import { docsAuthoringDirectory } from "../helper/common";
import { generateBaseUid } from "../helper/module";
import { readFileSync, existsSync } from "fs";
import { homedir } from 'os';
import { templateRepo } from '../helper/user-settings';
import { extensionPath } from '../extension';

const templateZip = join(homedir(), 'Downloads', 'learn-scaffolding-main.zip');
const localTemplateRepoPath = join(docsAuthoringDirectory, "learn-scaffolding-main");
const typeDefinitionJsonDirectory = join(localTemplateRepoPath, "module-type-definitions");
const fse = require("fs-extra");
const fs = require("fs");

export function scaffoldingeCommand() {
  const commands = [{ command: scaffoldModule.name, callback: scaffoldModule }];
  return commands;
}

/* temp solution until template repo is made public. 
check for repo zip file and download if it doesn't exist. */
export async function scaffoldModule(uri: Uri) {
  if (existsSync(templateZip)) {
    console.log('template zip already exists in download directory. Delete file to refresh templates.');
  } else {
    const open = require('open');
    open(templateRepo);
  }
  unzipTemplates(uri);
}

/* temp code until template repo is public 
unzip template package*/
async function unzipTemplates(uri: Uri) {
  const extract = require('extract-zip');
  const target = docsAuthoringDirectory;
  try {
    await extract(templateZip, { dir: target });
    moduleSelectionQuickPick(uri);
  } catch (err) {
    console.log(err);
  }
}

/* loop through module type definitions directory and store each module type */
export async function moduleSelectionQuickPick(uri: Uri) {
  let moduleTypes: QuickPickItem[] = [];
  fs.readdir(typeDefinitionJsonDirectory, function (err: string, files: any[]) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    files.forEach(function (file) {
      const jsonPath = join(typeDefinitionJsonDirectory, file);
      const moduleJson = readFileSync(jsonPath, "utf8");
      let data = JSON.parse(moduleJson);
      let patterns = data.moduleType.charAt(0).toUpperCase() + data.moduleType.slice(1);
      moduleTypes.push(patterns);
    });
    return showModuleSelector(uri, moduleTypes);
  });
}

/* display each module type to the user in a quickpick */
export async function showModuleSelector(uri: Uri, moduleTypes: any[]) {
  const opts: QuickPickOptions = { placeHolder: 'Select module pattern' };
  const selection = await window.showQuickPick(moduleTypes, opts);
  await getSelectedFolder(uri, selection.toLowerCase());
}

/* get module destination path and get module name */
export function getSelectedFolder(uri: Uri, moduleType: string) {
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
    copyTemplates(moduleName, moduleType, selectedFolder)
  });
}

/* temp code to copy template files from template directory to new module directory
to-do: use json info to copy files instead of hard-coding paths and types */
export function copyTemplates(moduleName: string, moduleType: string, selectedFolder: string) {
  const jsonPath = join(typeDefinitionJsonDirectory, `${moduleType}.json`);
  const moduleJson = readFileSync(jsonPath, "utf8");
  const data = JSON.parse(moduleJson);
  const scaffoldModule = join(selectedFolder, moduleName);

  /* to-do: update error workflow */
  if (existsSync(scaffoldModule)) {
    window.showWarningMessage(`${scaffoldModule} already exists. Please provide a new module name.`);
  }

  // copy index.yml
  const moduleYMLSource = resolve(typeDefinitionJsonDirectory, data.moduleTemplatePath);
  const moduleYMLTarget = join(scaffoldModule, "index.yml");
  fse.copySync(moduleYMLSource, moduleYMLTarget);

  // copy media placeholder
  const mediaPlaceholderSource = join(extensionPath, "media", "docs-logo-ms.png");
  const mediaPlaceholderTarget = join(scaffoldModule, "media", "placeholder.png");
  fse.copySync(mediaPlaceholderSource, mediaPlaceholderTarget);

  let templateFile: any;
  let scaffoldFilename: any;

  // loop through the selected module definition and copy files from the template template directory to the new module directory
  data.units.forEach((obj: any) => {
    scaffoldFilename = obj.scaffoldFilename;
    try {
      templateFile = resolve(typeDefinitionJsonDirectory, obj.moduleUnitTemplatePath);
      if(!existsSync(templateFile)) throw `${templateFile} does not exist and will be ommitted from the scaffolding process.`;
      fse.copySync(templateFile, join(scaffoldModule, `${scaffoldFilename}.yml`));
      if (obj.contentTemplatePath) {
        templateFile = resolve(typeDefinitionJsonDirectory, obj.contentTemplatePath);
        if(!existsSync(templateFile)) throw `${templateFile} does not exist and will be ommitted from the scaffolding process.`;
        fse.copySync(templateFile, join(scaffoldModule, "includes", `${scaffoldFilename}.md`));
      }
    } catch (error) {
      window.showWarningMessage(error);
    }
  });
  generateBaseUid(scaffoldModule, moduleName);
}
