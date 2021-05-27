"use-strict";

import { Uri, window, workspace } from "vscode";
import { reporter } from "./telemetry";
import { readFileSync, renameSync, rmdir } from "fs";
import { basename, join, parse } from "path";
import { default as Axios } from "axios";
import { localTemplateRepoPath } from "../controllers/template-controller";

export const output = window.createOutputChannel("docs-scaffolding");
export const sleepTime = 50;
const fileNumberRegex = /(.*?)-.*/;
const fs = require("fs");
const yaml = require("js-yaml");
const replace = require("replace-in-file");

/**
 * Create a posted warning message and applies the message to the log
 * @param {string} message - the message to post to the editor as an warning.
 */
export function postWarning(message: string) {
  window.showWarningMessage(message);
}

/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
export function postInformation(message: string) {
  window.showInformationMessage(message);
}

/**
 * Create a posted information message and applies the message to the log
 * @param {string} message - the message to post to the editor as an information.
 */
export function postError(message: string) {
  window.showErrorMessage(message);
}

export function hasValidWorkSpaceRootPath(senderName: string) {
  const folderPath = workspace.rootPath;

  if (folderPath === null) {
    postWarning(
      `The ${senderName} command requires an active workspace. Please open VS Code from the root of your clone to continue.`
    );
    return false;
  }

  return true;
}

/**
 * Create timestamp
 */
export function generateTimestamp() {
  const date = new Date(Date.now());
  return {
    msDateValue: date.toLocaleDateString("en-us"),
    msTimeValue: date.toLocaleTimeString([], { hour12: false }),
  };
}

/**
 * Return repo name
 * @param Uri
 */
export function getRepoName(workspacePath: Uri) {
  const repo = workspace.getWorkspaceFolder(workspacePath);
  if (repo) {
    const repoName = repo.name;
    return repoName;
  }
}

export function sendTelemetryData(
  telemetryCommand: string,
  commandOption: string,
  moduleName: string
) {
  const telemetryProperties = { pattern: commandOption, name: moduleName };
  reporter.sendTelemetryEvent(telemetryCommand, telemetryProperties);
}

/**
 * Output message with timestamp
 * @param message
 */
export function showStatusMessage(message: string) {
  const { msTimeValue } = generateTimestamp();
  output.appendLine(`[${msTimeValue}] - ${message}`);
}

export function cleanupTempDirectory(tempDirectory: string) {
  rmdir(tempDirectory, { recursive: true }, (err: any) => {
    if (err) {
      throw err;
    }
    showStatusMessage(
      `Temp working directory ${tempDirectory} has been delted.`
    );
  });
}

export function getSelectedFile(uri: Uri, moveDown?: boolean) {
  const selectedFileFullPath = parse(uri.fsPath);
  const selectedFileDir = selectedFileFullPath.dir;
  const currentFilename = selectedFileFullPath.name;
  const fileNumber = currentFilename.match(fileNumberRegex);
  const currentUnitNumber: any = parseInt(fileNumber![1]);
  let newUnitNumber;
  if (moveDown) {
    newUnitNumber = currentUnitNumber + 1;
  } else {
    newUnitNumber = currentUnitNumber - 1;
  }
  return {
    selectedFileDir,
    currentFilename,
    newUnitNumber,
    currentUnitNumber,
  };
}

export function getModuleUid(selectedFileDir: string) {
  try {
    let moduleIndex = join(selectedFileDir, "index.yml");
    const doc = yaml.load(fs.readFileSync(moduleIndex, "utf8"));
    return doc.uid;
  } catch (error) {
    output.appendLine(error);
  }
}

export function checkForUnitNumber(selectedFileDir: string) {
  try {
    let moduleIndex = join(selectedFileDir, "index.yml");
    const doc = yaml.load(fs.readFileSync(moduleIndex, "utf8"));
    const regex = /\.[0-9]*-.*/gm;
    if (doc.units) {
      const introductionUnit = doc.units[0];
      if (introductionUnit.match(regex)) {
        return true;
      }
    }
  } catch (error) {
    output.appendLine(error);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => {
    setTimeout(r, ms);
  });
}

export const naturalLanguageCompare = (a: string, b: string) => {
  return !!a && !!b
    ? a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    : 0;
};

export function getModuleTitleTemplate(
  localTemplateRepoPath: string,
  moduleType: string
) {
  try {
    const moduleTypeDefinitionJson = join(
      localTemplateRepoPath,
      "learn-scaffolding-main",
      "module-type-definitions",
      `${moduleType}.json`
    );
    const moduleJson = readFileSync(moduleTypeDefinitionJson, "utf8");
    let data = JSON.parse(moduleJson);
    return data.moduleTitleTemplate;
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

export function returnJsonData(jsonPath: string) {
  try {
    const moduleJson = readFileSync(jsonPath, "utf8");
    return JSON.parse(moduleJson);
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

export function replaceUnitPlaceholderWithTitle(
  unitPath: string,
  unitTitle: string
) {
  try {
    const options = {
      files: unitPath,
      from: /^title:\s{{unitName}}/gm,
      to: `title: ${unitTitle}`,
    };
    replace.sync(options);
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

export function getUnitTitle(unitPath: string) {
  try {
    const doc = yaml.load(fs.readFileSync(unitPath, "utf8"));
    return doc.title;
  } catch (error) {
    output.appendLine(error);
  }
}

export function replaceExistingUnitTitle(unitPath: string) {
  const unitTitlePlaceholder: string | undefined = getUnitTitle(unitPath);
  let inputBoxPlaceholder: string;
  if (unitTitlePlaceholder) {
    inputBoxPlaceholder = unitTitlePlaceholder;
  } else {
    inputBoxPlaceholder = "New unit title";
  }
  const getUserInput = window.showInputBox({
    placeHolder: inputBoxPlaceholder,
    prompt: "Enter new unit title.",
  });
  getUserInput.then(async (unitTitle) => {
    if (unitTitle) {
      try {
        const options = {
          files: unitPath,
          from: /^title:\s.*/gm,
          to: `title: ${unitTitle}`,
        };
        replace.sync(options);
      } catch (error) {
        postError(error);
        showStatusMessage(error);
      }
    }
  });
}

export async function publishedUidCheck(unitId: string) {
  const hierarchyServiceApi = `https://docs.microsoft.com/api/hierarchy/modules?unitId=${unitId}`;
  try {
    await Axios.get(hierarchyServiceApi);
    return true;
  } catch (error) {
    return false;
  }
}

export function getUnitUid(selectedUnit: string) {
  try {
    const doc = yaml.load(fs.readFileSync(selectedUnit, "utf8"));
    return doc.uid;
  } catch (error) {
    output.appendLine(error);
  }
}

export function updateUnitUid(
  unitName: string,
  unitPath: string,
  modulePath: string
) {
  try {
    let newUnitUid = getModuleUid(modulePath);
    newUnitUid = `uid: ${newUnitUid}.${unitName}`;
    const options = {
      files: unitPath,
      from: /^uid:\s.*/gm,
      to: newUnitUid,
    };
    replace.sync(options);
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

export function replaceUnitPatternPlaceholder(
  unitPath: string,
  patternType: string
) {
  try {
    const options = {
      files: unitPath,
      from: /{{patternType}}/gm,
      to: patternType,
    };
    replace.sync(options);
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

export function formatModuleName(moduleName: any, termsJsonPath: any) {
  try {
    let formattedModuleName = moduleName;
    const data = returnJsonData(termsJsonPath);
    let replace: any;
    let targetString: string | unknown;
    let replacementRegex: any;

    Object.entries(data.titleReplacements).forEach(function ([key, value]) {
      replace = key;
      targetString = value;
      replacementRegex = new RegExp("\\b(" + replace + ")\\b", "g");
      formattedModuleName = formattedModuleName
        .replace(replacementRegex, targetString)
        .replace(/ /g, "-")
        .replace(/--/g, "-")
        .toLowerCase();
    });
    return formattedModuleName;
  } catch (error) {
    showStatusMessage(error);
  }
}

export function renameCurrentFolder(uri: Uri) {
  const selectedFolder = uri.fsPath;
  const termsJsonPath = join(
    localTemplateRepoPath,
    "learn-scaffolding-main",
    "terms.json"
  );
  const getUserInput = window.showInputBox({
    placeHolder: basename(selectedFolder),
    prompt: "Enter new folder name.",
    validateInput: (userInput) =>
      userInput.length > 0 ? "" : "Please provide a folder name.",
  });
  getUserInput.then(async (folderName) => {
    if (!folderName) {
      return;
    }
    const currentFolderName = basename(selectedFolder);
    const newFolderName = await formatModuleName(folderName, termsJsonPath);
    const newFolderPath = selectedFolder.replace(
      currentFolderName,
      newFolderName
    );
    renamedModulePublishCheck(
      selectedFolder,
      currentFolderName,
      newFolderName,
      newFolderPath
    );
  });
}

async function renamedModulePublishCheck(
  folderPath: string,
  oldFolderName: string,
  newFolderName: string,
  newFolderPath: string
) {
  // get firt unit and create test uid
  const firstUnitRegex = /units:[\s\S]*?-\s?(.*)/m;
  const moduleIndex = join(folderPath, "index.yml");
  const moduleIndexContent = readFileSync(moduleIndex, "utf8");
  const firstUnit = moduleIndexContent.match(firstUnitRegex);
  if (firstUnit) {
    const newUid = firstUnit[1].replace(oldFolderName, newFolderName);
    const isPublished = await publishedUidCheck(newUid);
    if (isPublished) {
      postWarning(`Module ${basename(newFolderPath)} is published. Aborting folder rename command.`);
      showStatusMessage(`Module ${basename(newFolderPath)} is published. Aborting folder rename command.`);
    } else {
      renameSync(folderPath, newFolderPath);
      renameFolderInUids(newFolderPath, oldFolderName, newFolderName);
    }
  }
}

function renameFolderInUids(
  folderPath: string,
  oldFolderName: string,
  newFolderName: string
) {
  const regex = new RegExp(oldFolderName, "gm");
  try {
    const options = {
      files: `${folderPath}/*.yml`,
      from: regex,
      to: newFolderName,
    };
    replace.sync(options);
  } catch (error) {
    showStatusMessage(error);
  }
}

export function valueComparison(firstValue: any, secondValue: any) {
  return secondValue > firstValue;
}