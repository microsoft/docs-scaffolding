import { Uri, QuickPickItem, QuickPickOptions, window } from "vscode";
import { join, parse } from "path";
import { readdirSync } from "fs";
import { localTemplateRepoPath } from '../controllers/github-controller';
import { postError, showStatusMessage } from '../helper/common';
import { stubUnitReferences } from './module';

const fse = require("fs-extra");
const replace = require("replace-in-file");
const fs = require("fs");
const fileNumberRegex = /(.*?)-.*/;

export function getSelectedFile(uri: Uri, moveDown: boolean) {
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
        currentUnitNumber
    };
}

export function renamePeerAndTargetUnits(uri: Uri, moveDown: boolean) {
    let { selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber } = getSelectedFile(uri, moveDown);
    const moduleUnits = [] = readdirSync(selectedFileDir);
    const existingUnit = moduleUnits.filter((unit) => unit.startsWith(newUnitNumber));
    const existingUnitName = existingUnit.toString().split('.')[0];
    renameUnit(selectedFileDir, existingUnitName, currentUnitNumber, newUnitNumber);
    renameUnit(selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber);
}

export function renameUnit(selectedFileDir: any, currentFilename: string, newUnitNumber: any, currentUnitNumber: any) {
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
    const results = replace.sync(options);
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
    const opts: QuickPickOptions = { placeHolder: 'Select unit type' };
    const ymlExtension = '.yml';
    let unitFilter = [] = moduleTypes.filter(file => file.endsWith(ymlExtension));
    unitFilter = unitFilter.map(unit => unit.replace(/.yml/g, ''));
    const selection = await window.showQuickPick(unitFilter, opts);
    await copyUnitSelection(uri, selection, contentTemplateDirectory);
}

export function copyUnitSelection(uri: Uri, unitType: string, contentTemplateDirectory: string) {
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
        renameUnit(selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber);
        updateIndex(selectedFileDir);
    });
}

export function updateIndex(moduleDirectory: string) {
    const moduleIndex = join(moduleDirectory, 'index.yml');
    const options = {
        files: moduleIndex,
        from: /^(units:)([^]+?)(badge:)$/gm,
        to: 'units:\n {{units}}',
    };
    replace.sync(options);
    // stubUnitReferences(moduleDirectory);
    const yaml = require('js-yaml');

    try {
        let fileContents = fs.readFileSync(moduleIndex, 'utf8');
        let data = yaml.loadAll(fileContents);
        console.log(data[0].metadata);

    } catch (e) {
        console.log(e);
    }
}