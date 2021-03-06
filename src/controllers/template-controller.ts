import { join } from "path";
import { postError, showStatusMessage } from "../helper/common";
import { getUserSetting } from "../helper/user-settings";
import { homedir } from "os";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { extensionPath } from "../extension";

export let localTemplateRepoPath: string;
let templateZip: string;

export async function downloadTemplateZip() {
  const tmp = require("tmp");
  const docsAuthoringHomeDirectory = join(homedir(), "Docs Authoring");
  const offlineZip = join(
    docsAuthoringHomeDirectory,
    "learn-scaffolding-main.zip"
  );
  let templateRepo: any = await getUserSetting("template_repo");
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
    await runDownloader(templateRepo);
    templateZip = join(localTemplateRepoPath, "learn-scaffolding-main.zip");
    copyFileSync(templateZip, offlineZip);
  } catch (error) {
    if (existsSync(offlineZip)) {
      templateZip = offlineZip;
    } else {
      templateZip = join(extensionPath, "learn-scaffolding-main.zip");
    }
  }
  unzipTemplates();
}

export async function runDownloader(url: string) {
  const { DownloaderHelper } = require("node-downloader-helper");
  const downloadZip = new DownloaderHelper(url, localTemplateRepoPath);
  downloadZip.on("end", () => {
    showStatusMessage(
      `Template repo zip file successfully downloaded to ${localTemplateRepoPath}.`
    );
    return;
  });
  downloadZip.on("error", () => {
    showStatusMessage(
      `Error downloading templates from ${url}. Loading local templates.`
    );
    postError(
      `Error downloading templates from ${url}. Loading local templates.`
    );
  });
  downloadZip.start();
}

export async function unzipTemplates() {
  const AdmZip = require('adm-zip');
  try {
    const file = new AdmZip(templateZip);
    file.extractAllTo(localTemplateRepoPath);
  } catch (error) {
    postError(error);
    showStatusMessage(error);
  }
}
