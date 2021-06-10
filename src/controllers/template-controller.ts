import { join } from "path";
import { postError, showStatusMessage } from "../helper/common";
import { getUserSetting } from "../helper/user-settings";
import { homedir } from "os";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { extensionPath } from "../extension";

export let localTemplateRepoPath: string;
let templateZip: string;

export async function downloadTemplateZip() {
  const download = require("download");
  const tmp = require("tmp");
  const docsAuthoringHomeDirectory = join(homedir(), "Docs Authoring");
  const offlineZip = join(
    docsAuthoringHomeDirectory,
    "learn-scaffolding-main.zip"
  );
  let templateRepo: any = await getUserSetting('template_repo');
  if (!existsSync(docsAuthoringHomeDirectory)) {
    mkdirSync(docsAuthoringHomeDirectory);
  }
  localTemplateRepoPath = tmp.dirSync({ unsafeCleanup: true }).name;
  // cleanup temp folder on exit or reload
  tmp.setGracefulCleanup();
  showStatusMessage(
    `Temp working directory ${localTemplateRepoPath} has been created.`
  );
  try {
    await download(templateRepo, localTemplateRepoPath);
    templateZip = join(localTemplateRepoPath, "learn-scaffolding-main.zip");
    copyFileSync(templateZip, offlineZip);
  } catch (error) {
    if (existsSync(offlineZip)) {
      templateZip = offlineZip;
    } else {
      templateZip = join(extensionPath, "learn-scaffolding-main.zip");
    }
    postError(error);
    showStatusMessage(
      `Error downloading templates from ${templateRepo}. Loading local templates.`
    );
  }
  unzipTemplates();
}

export async function unzipTemplates() {
  const extract = require("extract-zip");
  try {
    await extract(templateZip, { dir: localTemplateRepoPath });
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}