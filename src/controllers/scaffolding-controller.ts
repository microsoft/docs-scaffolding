/* eslint-disable no-throw-literal, curly */

import { Uri, window, QuickPickItem, QuickPickOptions } from "vscode";
import { join, resolve } from "path";
import { generateBaseUid } from "../helper/module";
import { readFileSync, existsSync } from "fs";
import { homedir } from 'os';
import { extensionPath } from '../extension';
import { cleanupTempDirectory, postError, showStatusMessage, sendTelemetryData } from '../helper/common';
import { templateRepo } from '../helper/user-settings';

export let localTemplateRepoPath: string;

const telemetryCommand: string = 'create-module';
const fse = require("fs-extra");
const fs = require("fs");

let templateZip: string;
let rawModuleTitle: string;
let typeDefinitionJsonDirectory: string;

export function scaffoldingCommand() {
  const commands = [{ command: scaffoldModule.name, callback: scaffoldModule }];
  return commands;
}

/* temp solution until template repo is made public. 
check for repo zip file and download if it doesn't exist. */
export async function scaffoldModule(uri: Uri) {
  const download = require('download');
  const tmp = require('tmp');
  localTemplateRepoPath = tmp.dirSync({unsafeCleanup: true}).name;
  showStatusMessage(`Temp working directory ${localTemplateRepoPath} has been created.`);
  try {
    await download(templateRepo, localTemplateRepoPath);
    templateZip = join(homedir(), 'Downloads', 'learn-scaffolding-main.zip');
  } catch (error) {
    templateZip = join(extensionPath, 'offline-template-zip', 'learn-scaffolding-main.zip');
    postError(error);
    showStatusMessage(`Error downloading templates from ${templateRepo}. Loading local templates.`);
  }
    typeDefinitionJsonDirectory = join(localTemplateRepoPath, "learn-scaffolding-main", "module-type-definitions");
    unzipTemplates(uri);
}

/* temp code until template repo is public 
unzip template package*/
async function unzipTemplates(uri: Uri) {
  const extract = require('extract-zip');
  try {
    await extract(templateZip, { dir: localTemplateRepoPath });
    moduleSelectionQuickPick(uri);
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

/* loop through module type definitions directory and store each module type */
export async function moduleSelectionQuickPick(uri: Uri) {
  try {
    let moduleTypes: QuickPickItem[] = [];
    fs.readdir(typeDefinitionJsonDirectory, function (err: string, files: any[]) {
      if (err) {
        return postError("Unable to scan directory: " + err);
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
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
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
    rawModuleTitle = moduleName;
    moduleName = moduleName.replace(/ /g, "-").toLowerCase();
    sendTelemetryData(telemetryCommand, moduleType, moduleName);
    copyTemplates(moduleName, moduleType, selectedFolder);
  });
}

export async function copyTemplates(moduleName: string, moduleType: string, selectedFolder: string) {
  const jsonPath = join(typeDefinitionJsonDirectory, `${moduleType}.json`);
  const moduleJson = readFileSync(jsonPath, "utf8");
  const data = JSON.parse(moduleJson);
  const scaffoldModule = join(selectedFolder, moduleName);

  /* to-do: update error workflow */
  if (existsSync(scaffoldModule)) {
    window.showWarningMessage(`${scaffoldModule} already exists. Please provide a new module name.`);
    showStatusMessage(`${scaffoldModule} already exists. Please provide a new module name.`);
    await cleanupTempDirectory(localTemplateRepoPath);
    return;
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
    try {
      scaffoldFilename = obj.scaffoldFilename;
      templateFile = resolve(typeDefinitionJsonDirectory, obj.moduleUnitTemplatePath);
      if (!existsSync(templateFile)) throw `${templateFile} does not exist and will be omitted from the scaffolding process.`;
      fse.copySync(templateFile, join(scaffoldModule, `${scaffoldFilename}.yml`));
      if (obj.contentTemplatePath) {
        templateFile = resolve(typeDefinitionJsonDirectory, obj.contentTemplatePath);
        if (!existsSync(templateFile)) throw `${templateFile} does not exist and will be omitted from the scaffolding process.`;
        fse.copySync(templateFile, join(scaffoldModule, "includes", `${scaffoldFilename}.md`));
      }
    } catch (error) {
      window.showWarningMessage(error);
    }
  });
  await cleanupTempDirectory(localTemplateRepoPath);
  generateBaseUid(scaffoldModule, moduleName, moduleType, rawModuleTitle);
}
