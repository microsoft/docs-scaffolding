'use-strict';

import Axios from 'axios';
import { showStatusMessage, templateDirectory } from '../helper/common';
import { extensionName } from '../extension';
import { workspace } from 'vscode';

export async function logRepoData() {
    const templateRepo: string = workspace.getConfiguration(extensionName).content_repo;
	// const repoUrl = `https://github.com/MicrosoftDocs/content-templates`;
	const result = await Axios.get(templateRepo);
	showStatusMessage(`Content-templates repo URL and http response: ${templateRepo}, ${result.status}`);
	showStatusMessage(`Local template directory: ${templateDirectory}`);
}
