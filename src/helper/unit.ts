import { Uri } from "vscode";
import { join, parse } from "path";
import { readdirSync } from "fs";

const fse = require("fs-extra");
const replace = require("replace-in-file");

export function getSelectedFile(uri: Uri, moveDown: boolean) {
    const selectedFileFullPath = parse(uri.fsPath);
    const selectedFileDir = selectedFileFullPath.dir;
    const currentFilename = selectedFileFullPath.name;
    const fileNumberRegex = /(.*?)-.*/;
    const fileNumber = currentFilename.match(fileNumberRegex);
    const currentUnitNumber: any = parseInt(fileNumber![1]);
    let newUnitNumber;
    if (moveDown) {
        newUnitNumber = currentUnitNumber + 1;
    } else {
        newUnitNumber = currentUnitNumber - 1;
    }
    renamePeerAndTargetUnits(selectedFileDir, currentFilename, newUnitNumber, currentUnitNumber)
}

export function renamePeerAndTargetUnits(selectedFileDir: any, currentFilename: string, newUnitNumber: any, currentUnitNumber: any) {
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