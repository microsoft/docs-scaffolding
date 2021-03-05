import { join } from "path";
import { extensionPath } from '../extension';
import { postError, showStatusMessage } from '../helper/common';
import { templateRepo } from '../helper/user-settings';
import { homedir } from 'os';
import { copyFileSync, existsSync, mkdirSync } from "fs";

export let localTemplateRepoPath: string;
let templateZip: string;
const fs = require("fs");

export async function downloadTemplateZip() {
  const download = require('download');
  const tmp = require('tmp');
  const docsAuthoringHomeDirectory = join(homedir(), 'Docs Authoring');
  const offlineZip = join(docsAuthoringHomeDirectory, 'learn-scaffolding-main.zip');
  if (!existsSync(docsAuthoringHomeDirectory)) { 
    mkdirSync(docsAuthoringHomeDirectory);
  }
  localTemplateRepoPath = tmp.dirSync({ unsafeCleanup: true }).name;
  showStatusMessage(`Temp working directory ${localTemplateRepoPath} has been created.`);
  try {
    await download(templateRepo, localTemplateRepoPath);
    templateZip = join(localTemplateRepoPath, 'learn-scaffolding-main.zip');
    copyFileSync(templateZip, offlineZip);
  } catch (error) {
    templateZip = offlineZip;
    postError(error);
    showStatusMessage(`Error downloading templates from ${templateRepo}. Loading local templates.`);
  }
  unzipTemplates();
}

export async function unzipTemplates() {
    const extract = require('extract-zip');
    try {
      await extract(templateZip, { dir: localTemplateRepoPath });
    } catch (error) {
      postError(error);
      showStatusMessage(error);
    }
  }