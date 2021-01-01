import { Uri } from "vscode";
import { basename, join, parse } from "path";

const fse = require("fs-extra");
const replace = require("replace-in-file");

export function getSelectedFile(uri: Uri, moveDown: boolean) {
    const selectedFileFullPath = parse(uri.fsPath);
    const selectedFileDir = selectedFileFullPath.dir;
    const currentFilename = selectedFileFullPath.name;
    const fileNumberRegex = /(.*?)-.*/;
    const fileNumber = currentFilename.match(fileNumberRegex);
    const num: any = parseInt(fileNumber![1]);
    let newUnitNumber;
    if (moveDown) {
        newUnitNumber = num + 1;
    } else {
        newUnitNumber = num - 1;
    }
    const newFilename = currentFilename.replace(num, newUnitNumber);
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