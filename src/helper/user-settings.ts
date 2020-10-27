'use-strict';

import { workspace } from 'vscode';
import { extensionName } from '../extension';

// settings.json values
export const gitHubID: string = workspace.getConfiguration(extensionName).githubid;
export const alias: string = workspace.getConfiguration(extensionName).alias;
export const missingValue: string = 'NO VALUE SET';
export const learnRepoId: string = workspace.getConfiguration(extensionName).learn_repo_id;