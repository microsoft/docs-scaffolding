import { Uri, QuickPickItem, QuickPickOptions, window } from "vscode";
import { join } from "path";
import { readdirSync } from "fs";
import { localTemplateRepoPath } from '../controllers/template-controller';
import { checkForUnitNumber, getModuleUid, getSelectedFile, output, postError, showStatusMessage } from '../helper/common';
import { stubUnitReferences } from './module';

const fse = require("fs-extra");
const replace = require("replace-in-file");
const fs = require("fs");

let activeWorkingDirecotry: string;
let moduleUid: string;

export function renamePeerAndTargetUnits(uri: Uri, moveDown: boolean) {
    let { selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber } = getSelectedFile(uri, moveDown);
    if (activeWorkingDirecotry === selectedFileDir) {
        // if values match, uid does not need to be updated
    } else {
        activeWorkingDirecotry = selectedFileDir;
        moduleUid = getModuleUid(selectedFileDir);
    }
    try {
        const moduleUnits = [] = readdirSync(selectedFileDir)
        const totalUnits = moduleUnits.filter((unit) => unit.endsWith('.yml')).length;
        const existingUnit = moduleUnits.filter((unit) => unit.startsWith(newUnitNumber));
        let existingUnitName: string;
        if (existingUnit.length = 1) {
            existingUnitName = existingUnit.toString().split('.')[0];
        } else {
            postError('No unit has been selected');
            showStatusMessage('No unit has been selected');
            return;
        }
        if (newUnitNumber == 0) {
            postError('First unit cannot be moved up.');
            showStatusMessage('First unit cannot be moved up.');
            return;
        }
        if (newUnitNumber == totalUnits) {
            postError('Last unit cannot be moved down.');
            showStatusMessage('Last unit cannot be moved down.');
            return;
        }
        renameUnit(selectedFileDir, existingUnitName, currentUnitNumber, newUnitNumber);
        renameUnit(selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber);
        updateIndex(selectedFileDir);
        getModuleUid(selectedFileDir);
    } catch (error) {
        output.appendLine(error);
    }
}

export function renameUnit(selectedFileDir: any, currentFilename: string, newUnitNumber: any, currentUnitNumber: any) {
    try {
        const newFilename = currentFilename.replace(currentUnitNumber, newUnitNumber);
        const currentFilePath = join(selectedFileDir, `${currentFilename}.yml`);
        const newFilePath = join(selectedFileDir, `${newFilename}.yml`);
        fse.rename(currentFilePath, newFilePath);
        const currentIncludePath = join(selectedFileDir, 'includes', `${currentFilename}.md`);
        const newIncludePath = join(selectedFileDir, 'includes', `${newFilename}.md`);
        fse.rename(currentIncludePath, newIncludePath);
        const options = {
            files: newFilePath,
            from: currentFilename,
            to: newFilename,
        };
        replace.sync(options);
    } catch (error) {
        output.appendLine(error);
    }
}

export function addNewUnit(uri: Uri) {
    const contentTemplateDirectory = join(localTemplateRepoPath, "learn-scaffolding-main", "content-templates");
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

export async function showUnitSelector(uri: Uri, moduleTypes: any[], contentTemplateDirectory: string) {
    try {
        const opts: QuickPickOptions = { placeHolder: 'Select unit type' };
        const ymlExtension = '.yml';
        let unitFilter = [] = moduleTypes.filter(file => file.endsWith(ymlExtension) && file != 'default-index.yml');
        unitFilter = unitFilter.map(unit => unit.replace(/.yml/g, ''));
        const selection = await window.showQuickPick(unitFilter, opts);
        await copyUnitSelection(uri, selection, contentTemplateDirectory);
    } catch (error) {
        output.appendLine(error);
    }
}

export function copyUnitSelection(uri: Uri, unitType: string, contentTemplateDirectory: string) {
    try {
        const getUserInput = window.showInputBox({
            prompt: "Enter unit name.",
            validateInput: (userInput) =>
                userInput.length > 0 ? "" : "Please provide a unit name.",
        });
        getUserInput.then((unitName) => {
            if (!unitName) {
                return;
            }
            let formattedUnitName = unitName.replace(/ /g, "-").toLowerCase();
            let { selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber } = getSelectedFile(uri, true);
            fse.copySync(join(contentTemplateDirectory, `${unitType}.yml`), join(selectedFileDir, `${currentUnitNumber}-${formattedUnitName}.yml`));
            if (unitType == 'default-unit') {
                fse.copySync(join(contentTemplateDirectory, `default-exercise-unit.md`), join(selectedFileDir, 'includes', `${currentUnitNumber}-${formattedUnitName}.md`));
            }
            renameUnit(selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber);
            updateIndex(selectedFileDir);
        });
    } catch (error) {
        output.appendLine(error);
    }
}

export function updateIndex(moduleDirectory: string) {
    const preserveUnitNumber = checkForUnitNumber(moduleDirectory);
    try {
        const moduleIndex = join(moduleDirectory, 'index.yml');
        const options = {
            files: moduleIndex,
            from: /units:([\s\S]*?)badge:/gm,
            to: 'units:\n {{units}}\nbadge:',
        };
        replace.sync(options);
        if (preserveUnitNumber) {
            stubUnitReferences(moduleDirectory, true, moduleUid, true);
        } else {
            stubUnitReferences(moduleDirectory, true, moduleUid);
        }
    } catch (error) {
        output.appendLine(error);
    }
}

export function removeUnit(uri: Uri) {
    try {
        let { selectedFileDir, currentFilename } = getSelectedFile(uri, true);
        const selectedFile = join(selectedFileDir, `${currentFilename}.yml`);
        const includeMarkdown = join(selectedFileDir, 'includes', `${currentFilename}.md`);
        fs.unlinkSync(selectedFile);
        fs.unlinkSync(includeMarkdown);
        updateIndex(selectedFileDir);
    } catch (error) {
        output.appendLine(error);
    }
}

export function updateUnitName(uri: Uri) {
    try {
        const getUserInput = window.showInputBox({
            prompt: "Enter unit name.",
            validateInput: (userInput) =>
                userInput.length > 0 ? "" : "Please provide a unit name.",
        });
        getUserInput.then((unitName) => {
            if (!unitName) {
                return;
            }
            let newFilename = unitName.replace(/ /g, "-").toLowerCase();
            let { selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber } = getSelectedFile(uri, true);
            const currentFilePath = join(selectedFileDir, `${currentFilename}.yml`);
            const newFilePath = join(selectedFileDir, `${currentUnitNumber}-${newFilename}.yml`);
            fs.renameSync(currentFilePath, newFilePath);
            const currentIncludePath = join(selectedFileDir, 'includes', `${currentFilename}.md`);
            const newIncludePath = join(selectedFileDir, 'includes', `${currentUnitNumber}-${newFilename}.md`);
            fs.renameSync(currentIncludePath, newIncludePath);
            const options = {
                files: newFilePath,
                from: currentFilename,
                to: `${currentUnitNumber}-${newFilename}`,
            };
            replace.sync(options);
            renameUnit(selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber);
            updateIndex(selectedFileDir);
        });
    } catch (error) {
        output.appendLine(error);
    }
}