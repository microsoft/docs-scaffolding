import { Uri, QuickPickItem, QuickPickOptions, window } from "vscode";
import { basename, join } from "path";
import { readdirSync } from "fs";

import { localTemplateRepoPath } from "../controllers/template-controller";
import {
  getModuleUid,
  getSelectedFile,
  getUnitTitle,
  getUnitUid,
  naturalLanguageCompare,
  output,
  postError,
  postWarning,
  publishedUidCheck,
  replaceExistingUnitTitle,
  sendTelemetryData,
  showStatusMessage,
  sleep,
  sleepTime,
  updateUnitUid,
} from "../helper/common";
import { getUserSetting } from "../helper/user-settings";

const fse = require("fs-extra");
const replace = require("replace-in-file");
const fs = require("fs");
const yaml = require("js-yaml");
const includeRegex = /includes\/.*\.md/;
const uidRegex = /^uid.*/gm;

let activeWorkingDirecotry: string;

export function renamePeerAndTargetUnits(uri: Uri, moveDown: boolean) {
  const telemetryCommand: string = "reorder-unit";
  let {
    selectedFileDir,
    currentFilename,
    newUnitNumber,
    currentUnitNumber,
  } = getSelectedFile(uri, moveDown);
  if (activeWorkingDirecotry === selectedFileDir) {
    // if values match, uid does not need to be updated
  } else {
    activeWorkingDirecotry = selectedFileDir;
  }
  try {
    const moduleUnits = ([] = readdirSync(selectedFileDir));
    const totalUnits = moduleUnits.filter((unit) => unit.endsWith(".yml"))
      .length;
    const existingUnit = moduleUnits.filter((unit) =>
      unit.startsWith(newUnitNumber)
    );
    let existingUnitName: string;
    if ((existingUnit.length = 1)) {
      existingUnitName = existingUnit.toString().split(".")[0];
    } else {
      postError("No unit has been selected");
      showStatusMessage("No unit has been selected");
      return;
    }
    if (newUnitNumber === 0) {
      postError("First unit cannot be moved up.");
      showStatusMessage("First unit cannot be moved up.");
      return;
    }
    if (newUnitNumber === totalUnits) {
      postError("Last unit cannot be moved down.");
      showStatusMessage("Last unit cannot be moved down.");
      return;
    }
    sendTelemetryData(telemetryCommand, "", currentFilename);
    renameUnit(
      selectedFileDir,
      existingUnitName,
      currentUnitNumber,
      newUnitNumber
    )
      .then(() =>
        renameUnit(
          selectedFileDir,
          currentFilename,
          newUnitNumber,
          currentUnitNumber
        )
      )
      .then(() => updateIndex(selectedFileDir))
      .then(() => updateIncludes(selectedFileDir));
  } catch (error) {
    output.appendLine(error);
  }
}

export async function renameUnit(
  selectedFileDir: any,
  currentFilename: string,
  newUnitNumber: any,
  currentUnitNumber: any
) {
  try {
    const newFilename = currentFilename.replace(
      currentUnitNumber,
      newUnitNumber
    );
    const currentFilePath = join(selectedFileDir, `${currentFilename}.yml`);
    const newFilePath = join(selectedFileDir, `${newFilename}.yml`);
    fse.rename(currentFilePath, newFilePath);
    const currentIncludePath = join(
      selectedFileDir,
      "includes",
      `${currentFilename}.md`
    );
    const newIncludePath = join(
      selectedFileDir,
      "includes",
      `${newFilename}.md`
    );
    fse.rename(currentIncludePath, newIncludePath);
  } catch (error) {
    output.appendLine(error);
  }
}

export async function updateIncludes(selectedFileDir: string) {
  try {
    let filenames = fs.readdirSync(selectedFileDir);
    filenames.forEach((file: any) => {
      const filePath = join(selectedFileDir, file);
      const fileName = basename(filePath, ".yml");
      const options = {
        files: filePath,
        from: includeRegex,
        to: `includes/${fileName}.md`,
      };
      replace.sync(options);
    });
  } catch (error) {
    showStatusMessage(error);
  }
}

export function addNewUnit(uri: Uri) {
  const contentTemplateDirectory = join(
    localTemplateRepoPath,
    "learn-scaffolding-main",
    "content-templates"
  );
  try {
    let moduleTypes: QuickPickItem[] = [];
    fs.readdir(contentTemplateDirectory, function (err: string, files: any[]) {
      if (err) {
        return postError("Unable to scan directory: " + err);
      }
      files.forEach(function (file) {
        moduleTypes.push(file);
      });
      return showUnitSelector(uri, moduleTypes, contentTemplateDirectory);
    });
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}

export async function showUnitSelector(
  uri: Uri,
  moduleTypes: any[],
  contentTemplateDirectory: string
) {
  try {
    const opts: QuickPickOptions = { placeHolder: "Select unit type" };
    const ymlExtension = ".yml";
    let unitFilter = ([] = moduleTypes.filter(
      (file) => file.endsWith(ymlExtension) && file !== "default-index.yml"
    ));
    unitFilter = unitFilter.map((unit) => unit.replace(/.yml/g, ""));
    const selection = await window.showQuickPick(unitFilter, opts);
    await copyUnitSelection(uri, selection, contentTemplateDirectory);
  } catch (error) {
    output.appendLine(error);
  }
}

export function copyUnitSelection(
  uri: Uri,
  unitType: string,
  contentTemplateDirectory: string
) {
  const telemetryCommand: string = "add-unit";
  try {
    const getUserInput = window.showInputBox({
      prompt: "Enter unit name.",
      validateInput: (userInput) =>
        userInput.length > 0 ? "" : "Please provide a unit name.",
    });
    getUserInput.then(async (unitName) => {
      if (!unitName) {
        return;
      }
      let formattedUnitName = unitName.replace(/ /g, "-").toLowerCase();
      let {
        selectedFileDir,
        currentFilename,
        newUnitNumber,
        currentUnitNumber,
      } = getSelectedFile(uri, true);
      await bulkUpdateFileNamePrefix(selectedFileDir, newUnitNumber, true);
      fse.copySync(
        join(contentTemplateDirectory, `${unitType}.yml`),
        join(selectedFileDir, `${currentUnitNumber}-${formattedUnitName}.yml`)
      );
      if (unitType === "default-unit") {
        fse.copySync(
          join(contentTemplateDirectory, `default-exercise-unit.md`),
          join(
            selectedFileDir,
            "includes",
            `${currentUnitNumber}-${formattedUnitName}.md`
          )
        );
      }
      const moduleUid = getModuleUid(selectedFileDir);
      const newFilePath = join(
        selectedFileDir,
        `${currentUnitNumber}-${formattedUnitName}.yml`
      );
      await replaceExistingUnitTitle(newFilePath);
      let options = {
        files: newFilePath,
        from: uidRegex,
        to: `uid: ${moduleUid}.${formattedUnitName}`,
      };
      replace.sync(options);
      options = {
        files: newFilePath,
        from: /\s*type:\s?{{patternType}}/m,
        to: "",
      };
      replace.sync(options);
      let date: any = new Date(Date.now());
      date = date.toLocaleDateString();
      let msAuthor: any = await getUserSetting('alias');
      let author: any = await getUserSetting('githubid');
      sendTelemetryData(telemetryCommand, unitType, formattedUnitName);
      renameUnit(
        selectedFileDir,
        currentFilename,
        newUnitNumber,
        currentUnitNumber
      )
        .then(() => updateIndex(selectedFileDir))
        .then(() => replaceStubTokens(newFilePath, "{{unitName}}", unitName))
        .then(() => replaceStubTokens(newFilePath, "{{msDate}}", date))
        .then(() =>
          replaceStubTokens(newFilePath, "{{githubUsername}}", author)
        )
        .then(() => replaceStubTokens(newFilePath, "{{msUser}}", msAuthor))
        .then(() => removeStubComments(newFilePath))
        .then(() => updateIncludes(selectedFileDir));
    });
  } catch (error) {
    output.appendLine(error);
  }
}

export async function updateIndex(moduleDirectory: string) {
  try {
    await sleep(sleepTime);
    const yaml = require("js-yaml");
    let unitBlock: any = [];
    let filenames = fs.readdirSync(moduleDirectory);
    filenames = filenames.sort(naturalLanguageCompare);
    filenames.forEach((file: any) => {
      if (file.endsWith(".yml") && file !== "index.yml") {
        let doc = yaml.load(
          fs.readFileSync(join(moduleDirectory, file), "utf8")
        );
        if (doc.uid) {
          unitBlock.push(`- ${doc.uid}`);
        }
      }
    });
    const moduleIndex = join(moduleDirectory, "index.yml");
    let options = {
      files: moduleIndex,
      from: /units:([\s\S]*?)badge:/gm,
      to: `units:\n${unitBlock.join("\n")}\nbadge:`,
    };
    replace.sync(options);
  } catch (error) {
    output.appendLine(error);
  }
}

export function removeUnit(uri: Uri) {
  const telemetryCommand: string = "delete-unit";
  try {
    let {
      selectedFileDir,
      currentFilename,
      currentUnitNumber,
    } = getSelectedFile(uri, true);
    const selectedFile = join(selectedFileDir, `${currentFilename}.yml`);
    const includeMarkdown = join(
      selectedFileDir,
      "includes",
      `${currentFilename}.md`
    );
    fs.unlinkSync(selectedFile);
    fs.unlinkSync(includeMarkdown);
    updateIndex(selectedFileDir);
    bulkUpdateFileNamePrefix(selectedFileDir, currentUnitNumber, false);
    sendTelemetryData(telemetryCommand, "", currentFilename);
  } catch (error) {
    output.appendLine(error);
  }
}

export async function updateUnitName(uri: Uri) {
  const telemetryCommand: string = "rename-unit";
  try {
    let {
      selectedFileDir,
      currentFilename,
      newUnitNumber,
      currentUnitNumber,
    } = getSelectedFile(uri, true);
    const baseUnitFileName = currentFilename.replace(/[0-9]+.*?-/gm, "");
    const currentFilePath = join(selectedFileDir, `${currentFilename}.yml`);
    const getUserInput = window.showInputBox({
      placeHolder: baseUnitFileName,
      prompt: "Enter a new file name (with no prefix or extension).",
      validateInput: (userInput) =>
        userInput.length > 0 ? "" : "Please provide a file name.",
    });
    getUserInput.then(async (unitName) => {
      if (!unitName) {
        return;
      }
      let newFilename = unitName.replace(/ /g, "-").toLowerCase();
      const moduleUid: string = getModuleUid(selectedFileDir);
      const unitUid = moduleUid.concat(`.${newFilename}`);
      const isPublished = await publishedUidCheck(unitUid);
      if (isPublished) {
        postWarning(
          `Unit ${unitUid} is published. Aborting unit rename command.`
        );
        showStatusMessage(
          `Unit ${unitUid} is published. Aborting unit rename command.`
        );
        return;
      } else {
        const newFilePath = join(
          selectedFileDir,
          `${currentUnitNumber}-${newFilename}.yml`
        );
        fs.renameSync(currentFilePath, newFilePath);
        const currentIncludePath = join(
          selectedFileDir,
          "includes",
          `${currentFilename}.md`
        );
        if (fs.existsSync(currentIncludePath)) {
          const newIncludePath = join(
            selectedFileDir,
            "includes",
            `${currentUnitNumber}-${newFilename}.md`
          );
          fs.renameSync(currentIncludePath, newIncludePath);
        }
        await replaceExistingUnitTitle(newFilePath);
        updateUnitUid(newFilename, newFilePath, selectedFileDir);
        sendTelemetryData(telemetryCommand, "", currentFilename);
        renameUnit(
          selectedFileDir,
          currentFilename,
          newUnitNumber,
          currentUnitNumber
        )
          .then(() => updateIndex(selectedFileDir))
          .then(() => updateIncludes(selectedFileDir));
      }
    });
  } catch (error) {
    output.appendLine(error);
  }
}

export function replaceStubTokens(
  sourceFile: string,
  sourceString: string,
  replacementString: string
) {
  if (!replacementString || replacementString.length === 0) {
    showStatusMessage(
      `No replacement value for ${sourceString}. Leaving placeholder.`
    );
  } else {
    const regex = new RegExp(sourceString, "g");
    const options = {
      files: sourceFile,
      from: regex,
      to: replacementString,
    };
    replace.sync(options);
  }
}

export function removeStubComments(sourceFile: string) {
  const options = {
    files: sourceFile,
    from: /#\s?stub.*/g,
    to: "",
  };
  replace.sync(options);
}

export function bulkUpdateFileNamePrefix(
  selectedFileDir: string,
  startingPrefix: number,
  incrementPrefix: boolean
) {
  let regex: RegExp;
  if (startingPrefix < 10) {
    regex = new RegExp("^[" + startingPrefix + "-9]|\\d\\d\\d*-", "gm");
  } else {
    regex = new RegExp("^[" + startingPrefix + "][0-9]|\\d\\d\\d*-", "gm");
  }

  const fileNumberRegex = /^(?:[0-9]|\d\d\d*)./gm;
  try {
    let filenames = fs.readdirSync(selectedFileDir);
    filenames.forEach((file: any) => {
      if (file.match(regex)) {
        let currentPrefix = file.match(fileNumberRegex);
        currentPrefix = parseInt(currentPrefix);
        let newPrefix: number;
        if (incrementPrefix) {
          newPrefix = currentPrefix + 1;
        } else {
          newPrefix = currentPrefix - 1;
        }
        let fileName = file
          .replace(/^(?:[0-9]|\d\d\d*)-/, "")
          .replace(".yml", "");
        const currentFilePath = join(selectedFileDir, `${file}`);
        if (fs.existsSync(currentFilePath)) {
          const newFilePath = join(
            selectedFileDir,
            `${newPrefix}-${fileName}.yml`
          );
          fs.renameSync(currentFilePath, newFilePath);
        }
        const currentIncludePath = join(
          selectedFileDir,
          "includes",
          file.replace(".yml", ".md")
        );
        if (fs.existsSync(currentIncludePath)) {
          const newIncludePath = join(
            selectedFileDir,
            "includes",
            `${newPrefix}-${fileName}.md`
          );
          fs.renameSync(currentIncludePath, newIncludePath);
        }
        updateIncludes(selectedFileDir);
      }
    });
  } catch (error) {
    showStatusMessage(error);
  }
}
