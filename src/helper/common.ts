'use-strict';

import { Uri, window, workspace } from 'vscode';
import { reporter } from './telemetry';
import { readFileSync, rmdir } from 'fs';
import { join, parse } from "path";
import { default as Axios } from 'axios';

export const output = window.createOutputChannel('docs-scaffolding');
export const sleepTime = 50;
const fileNumberRegex = /(.*?)-.*/;
const fs = require("fs");
const yaml = require('js-yaml');
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
		msDateValue: date.toLocaleDateString('en-us'),
		msTimeValue: date.toLocaleTimeString([], { hour12: false })
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

export function sendTelemetryData(telemetryCommand: string, commandOption: string, moduleName: string) {
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
		showStatusMessage(`Temp working directory ${tempDirectory} has been delted.`);
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
		currentUnitNumber
	};
}

export function getModuleUid(selectedFileDir: string) {
	try {
		let moduleIndex = join(selectedFileDir, 'index.yml');
		const doc = yaml.load(fs.readFileSync(moduleIndex, 'utf8'));
		return doc.uid;

	} catch (error) {
		output.appendLine(error);
	}
}

export function checkForUnitNumber(selectedFileDir: string) {
	try {
		let moduleIndex = join(selectedFileDir, 'index.yml');
		const doc = yaml.load(fs.readFileSync(moduleIndex, 'utf8'));
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
	return new Promise(r => {
		setTimeout(r, ms);
	});
}

export const naturalLanguageCompare = (a: string, b: string) => {
	return !!a && !!b ? a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) : 0;
};

export function getModuleTitleTemplate(localTemplateRepoPath: string, moduleType: string) {
	try {
		const moduleTypeDefinitionJson = join(localTemplateRepoPath, "learn-scaffolding-main", "module-type-definitions", `${moduleType}.json`);
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

export function replaceUnitPlaceholderWithTitle(unitPath: string, unitTitle: string) {
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
		const doc = yaml.load(fs.readFileSync(unitPath, 'utf8'));
		return doc.title;
	} catch (error) {
		output.appendLine(error);
	}
}

export function replaceExistingUnitTitle(unitPath: string) {
	const unitTitlePlaceholder: string = getUnitTitle(unitPath);
	const getUserInput = window.showInputBox({
		placeHolder: unitTitlePlaceholder,
		prompt: "Enter new unit title.",
		validateInput: (userInput) =>
			userInput.length > 0 ? "" : "Please provide a unit title.",
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

export async function publishedUidCheck(unitId: string, unitName: string, unitPath: string, modulePath: string) {
	const hierarchyServiceApi = `https://docs.microsoft.com/api/hierarchy/modules?unitId=${unitId}`;
	await Axios.get(hierarchyServiceApi).then(function () {
		// not needed because this is the expected behaviour; remove comment for debugging. showStatusMessage(`Live UID :${unitId}. Yml UID will not be changed.`);
	}).catch(function () {
		showStatusMessage(`UID ${unitId} is not published. Yml UID will be updated.`);
		updateUnitUid(unitName, unitPath, modulePath);
	});
}

export function getUnitUid(selectedUnit: string) {
	try {
		const doc = yaml.load(fs.readFileSync(selectedUnit, 'utf8'));
		return doc.uid;
	} catch (error) {
		output.appendLine(error);
	}
}

export function updateUnitUid(unitName: string, unitPath: string, modulePath: string) {
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

export function replaceUnitPatternPlaceholder(unitPath: string, patternType: string) {
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
