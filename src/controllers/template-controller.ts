import { join } from "path";
import { extensionPath } from '../extension';
import { postError, showStatusMessage } from '../helper/common';
import { templateRepo } from '../helper/user-settings';

export let localTemplateRepoPath: string;
let templateZip: string;

export async function downloadTemplateZip() {
  const download = require('download');
  const tmp = require('tmp');
  localTemplateRepoPath = tmp.dirSync({ unsafeCleanup: true }).name;
  showStatusMessage(`Temp working directory ${localTemplateRepoPath} has been created.`);
  try {
    await download(templateRepo, localTemplateRepoPath);
    templateZip = join(localTemplateRepoPath, 'learn-scaffolding-main.zip');
  } catch (error) {
    templateZip = join(extensionPath, 'offline-template-zip', 'learn-scaffolding-main.zip');
    postError(error);
    // showStatusMessage(`Error downloading templates from ${templateRepo}. Loading local templates.`);
  }
  unzipTemplates();
}

export async function unzipTemplates() {
    const extract = require('extract-zip');
    try {
      await extract(templateZip, { dir: localTemplateRepoPath });
    } catch (error) {
      postError(error);
      // showStatusMessage(error);
    }
  }