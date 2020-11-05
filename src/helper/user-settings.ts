'use-strict';

import { workspace } from 'vscode';

// settings.json values
export const gitHubID: string = workspace.getConfiguration('docs.scaffolding').githubid;
export const alias: string = workspace.getConfiguration('docs.scaffolding').alias;
export const learnRepoId: string = workspace.getConfiguration('docs.scaffolding').learn_repo_id;
export const templateRepo: string = workspace.getConfiguration('docs.scaffolding').template_repo;