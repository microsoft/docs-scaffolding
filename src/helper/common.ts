'use-strict';

import { Uri, window, workspace } from 'vscode';
import { reporter } from './telemetry';
import { rmdir } from 'fs';
import * as os from 'os';

export const output = window.createOutputChannel('docs-scaffolding');

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
	const telemetryProperties = { module_pattern: commandOption, module_name: moduleName };
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
