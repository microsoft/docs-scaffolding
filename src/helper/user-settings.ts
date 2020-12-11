'use-strict';

import { workspace } from 'vscode';

// settings.json values
export const gitHubID: string = workspace.getConfiguration('docs.scaffolding').githubid;
export const alias: string = workspace.getConfiguration('docs.scaffolding').alias;
export const defaultPrefix: string = workspace.getConfiguration('docs.scaffolding').prefix;
export const templateRepo: string = workspace.getConfiguration('docs.scaffolding').template_repo;
export const defaultProduct: string = workspace.getConfiguration('docs.scaffolding').product;