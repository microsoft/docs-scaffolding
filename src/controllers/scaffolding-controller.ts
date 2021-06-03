/* eslint-disable no-throw-literal, curly */

import { Uri, window, QuickPickItem, QuickPickOptions } from "vscode";
import { basename, join, resolve } from "path";
import { generateBaseUid } from "../helper/module";
import { readFileSync, existsSync } from "fs";
import {
  cleanupTempDirectory,
  postError,
  showStatusMessage,
  sendTelemetryData,
  getModuleTitleTemplate,
  returnJsonData,
  replaceUnitPlaceholderWithTitle,
  replaceUnitPatternPlaceholder,
  formatModuleName,
  renameCurrentFolder,
  showOptionalFolderInputBox,
} from "../helper/common";
import {
  addNewUnit,
  renamePeerAndTargetUnits,
  removeUnit,
  updateUnitName,
} from "../helper/unit";
import { localTemplateRepoPath } from "./template-controller";

const platformRegex = /\\/g;
const telemetryCommand: string = "create-module";
const fse = require("fs-extra");
const fs = require("fs");

let rawModuleTitle: string;
let typeDefinitionJsonDirectory: string;

export function scaffoldingCommand() {
  const commands = [
    { command: scaffoldModule.name, callback: scaffoldModule },
    {
      command: scaffoldModuleInCurrentDirectory.name,
      callback: scaffoldModuleInCurrentDirectory,
    },
    { command: moveSelectionDown.name, callback: moveSelectionDown },
    { command: moveSelectionUp.name, callback: moveSelectionUp },
    { command: insertNewUnit.name, callback: insertNewUnit },
    { command: deleteUnit.name, callback: deleteUnit },
    { command: renameUnit.name, callback: renameUnit },
    { command: updateModuleFolderName.name, callback: updateModuleFolderName },
  ];
  return commands;
}

export async function scaffoldModule(uri: Uri) {
  typeDefinitionJsonDirectory = join(
    localTemplateRepoPath,
    "learn-scaffolding-main",
    "module-type-definitions"
  );
  moduleSelectionQuickPick(uri);
}

export async function scaffoldModuleInCurrentDirectory(uri: Uri) {
  typeDefinitionJsonDirectory = join(
    localTemplateRepoPath,
    "learn-scaffolding-main",
    "module-type-definitions"
  );
  moduleSelectionQuickPick(uri, true);
}

/* loop through module type definitions directory and store each module type */
export async function moduleSelectionQuickPick(
  uri: Uri,
  currentFolder?: boolean
) {
  try {
    let moduleTypes: QuickPickItem[] = [];
    fs.readdir(
      typeDefinitionJsonDirectory,
      function (err: string, files: any[]) {
        if (err) {
          return postError(
            `Unable to scan local template directory: ${typeDefinitionJsonDirectory}. Please try again.`
          );
        }
        files.forEach(function (file) {
          const jsonPath = join(typeDefinitionJsonDirectory, file);
          const data = returnJsonData(jsonPath);
          let patterns =
            data.moduleType.charAt(0).toUpperCase() + data.moduleType.slice(1);
          moduleTypes.push(patterns);
        });
        if (currentFolder) {
          return showModuleSelector(uri, moduleTypes, true);
        } else {
          return showModuleSelector(uri, moduleTypes);
        }
      }
    );
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

/* display each module type to the user in a quickpick */
export async function showModuleSelector(
  uri: Uri,
  moduleTypes: any[],
  currentFolder?: boolean
) {
  const opts: QuickPickOptions = { placeHolder: "Select module pattern" };
  const selection = await window.showQuickPick(moduleTypes, opts);
  if (currentFolder) {
    await getSelectedFolder(uri, selection.toLowerCase(), true);
  } else {
    await getSelectedFolder(uri, selection.toLowerCase());
  }
}

/* get module destination path and get module name */
export function getSelectedFolder(
  uri: Uri,
  moduleType: string,
  currentFolder?: boolean
) {
  const moduleTitlePlaceholder = getModuleTitleTemplate(
    localTemplateRepoPath,
    moduleType
  );
  const selectedFolder = uri.fsPath;
  const getUserInput = window.showInputBox({
    placeHolder: moduleTitlePlaceholder,
    prompt: "Enter module name.",
    validateInput: (userInput) =>
      userInput.length > 0 ? "" : "Please provide a module name.",
  });
  getUserInput.then(async (moduleName) => {
    if (!moduleName) {
      return;
    }
    const termsJsonPath = join(
      localTemplateRepoPath,
      "learn-scaffolding-main",
      "terms.json"
    );
    let moduleFolderName: any = formatModuleName(moduleName, termsJsonPath);
    rawModuleTitle = moduleName;
    moduleName = moduleName.replace(/ /g, "-").toLowerCase();
    sendTelemetryData(telemetryCommand, moduleType, moduleName);
    if (currentFolder) {
      copyTemplates(
        moduleFolderName,
        moduleName,
        moduleType,
        selectedFolder,
        true
      );
    } else {
      showOptionalFolderInputBox(moduleFolderName, moduleName, moduleType, selectedFolder);
    }
  });
}

export async function copyTemplates(
  modifiedModuleName: string,
  moduleName: string,
  moduleType: string,
  selectedFolder: string,
  currentFolder?: boolean
) {
  const jsonPath = join(typeDefinitionJsonDirectory, `${moduleType}.json`);
  const data = returnJsonData(jsonPath);
  let scaffoldModule: any;
  if (currentFolder) {
    scaffoldModule = selectedFolder;
  } else {
    scaffoldModule = join(selectedFolder, modifiedModuleName);
    /* to-do: update error workflow */
    if (existsSync(scaffoldModule)) {
      window.showWarningMessage(
        `${scaffoldModule} already exists. Please provide a new module name.`
      );
      showStatusMessage(
        `${scaffoldModule} already exists. Please provide a new module name.`
      );
      await cleanupTempDirectory(localTemplateRepoPath);
      return;
    }
  }

  // copy index.yml
  const moduleYMLSource = resolve(
    typeDefinitionJsonDirectory,
    data.moduleTemplatePath.replace(platformRegex, "/")
  );
  const moduleYMLTarget = join(scaffoldModule, "index.yml");
  fse.copySync(moduleYMLSource, moduleYMLTarget);

  // create media directory
  const mediaFolder = join(scaffoldModule, "media");
  fs.mkdirSync(mediaFolder);

  let templateFile: any;
  let scaffoldFilename: any;

  // loop through the selected module definition and copy files from the template template directory to the new module directory
  data.units.forEach((obj: any) => {
    try {
      scaffoldFilename = obj.scaffoldFilename;
      templateFile = resolve(
        typeDefinitionJsonDirectory,
        obj.moduleUnitTemplatePath.replace(platformRegex, "/")
      );
      if (!existsSync(templateFile))
        throw `${templateFile} does not exist and will be omitted from the scaffolding process.`;
      fse.copySync(
        templateFile,
        join(scaffoldModule, `${scaffoldFilename}.yml`)
      );
      if (obj.unitTitleTemplate) {
        const unitPath = join(scaffoldModule, `${scaffoldFilename}.yml`);
        const unitTitle = obj.unitTitleTemplate;
        replaceUnitPlaceholderWithTitle(unitPath, unitTitle);
      }
      if (obj.type) {
        const unitPath = join(scaffoldModule, `${scaffoldFilename}.yml`);
        const unitType = obj.type;
        replaceUnitPatternPlaceholder(unitPath, unitType);
      }
      if (obj.contentTemplatePath) {
        templateFile = resolve(
          typeDefinitionJsonDirectory,
          obj.contentTemplatePath.replace(platformRegex, "/")
        );
        if (!existsSync(templateFile)) {
          showStatusMessage(
            `${templateFile} does not exist and will be omitted from the scaffolding process.`
          );
          throw `${templateFile} does not exist and will be omitted from the scaffolding process.`;
        }
        fse.copySync(
          templateFile,
          join(scaffoldModule, "includes", `${scaffoldFilename}.md`)
        );
      }
    } catch (error) {
      window.showWarningMessage(error);
    }
  });
  if (currentFolder) {
    generateBaseUid(
      scaffoldModule,
      basename(scaffoldModule),
      moduleType,
      rawModuleTitle
    );
  } else {
    generateBaseUid(
      scaffoldModule,
      modifiedModuleName,
      moduleType,
      rawModuleTitle
    );
  }
}

export function moveSelectionDown(uri: Uri) {
  renamePeerAndTargetUnits(uri, true);
}

export function moveSelectionUp(uri: Uri) {
  renamePeerAndTargetUnits(uri, false);
}

export function insertNewUnit(uri: Uri) {
  addNewUnit(uri);
}

export function deleteUnit(uri: Uri) {
  removeUnit(uri);
}

export function renameUnit(uri: Uri) {
  updateUnitName(uri);
}

export function updateModuleFolderName(uri: Uri) {
  renameCurrentFolder(uri);
}
