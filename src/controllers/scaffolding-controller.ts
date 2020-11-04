import { Uri, window, QuickPickItem, QuickPickOptions } from "vscode";
import { join } from "path";
import { docsAuthoringDirectory } from "../helper/common";
import { generateBaseUid } from "../helper/module";
import { readFileSync, existsSync } from "fs";
import { homedir } from 'os';
import { templateRepo } from '../helper/user-settings';
import { extensionPath } from '../extension';

const templateZip = join(homedir(), 'Downloads', 'learn-scaffolding-main.zip');
const localTemplateRepoPath = join(docsAuthoringDirectory, "learn-scaffolding-main");
const typeDefinitionJsonDirectory = join(localTemplateRepoPath, "module-type-definitions");
const fse = require("fs-extra");

export function scaffoldingeCommand() {
	const commands = [{ command: scaffoldModule.name, callback: scaffoldModule }];
	return commands;
}

/* temp solution until template repo is made public. 
check for repo zip file and download if it doesn't exist. */
export async function scaffoldModule(uri: Uri) {
  if (existsSync(templateZip)) {
    window.showWarningMessage('template zip already exists in download directory. Delete file to refresh templates.');
    unzipTemplates(uri);
  } else {
    const open = require('open');
    open(templateRepo);
    unzipTemplates(uri);
  }
}

/* temp code until template repo is public 
unzip template package*/
async function unzipTemplates(uri: Uri) {
  const extract = require('extract-zip');
  const target = docsAuthoringDirectory;
  try {
    await extract(templateZip, { dir: target });
    moduleSelectionQuickPick(uri);
  } catch (err) {
    console.log(err);
  }
}

/* loop through module type definitions directory and store each module type */
export async function moduleSelectionQuickPick(uri: Uri) {
  const fs = require("fs");
  
  let moduleTypes: QuickPickItem[] = [];
  fs.readdir(typeDefinitionJsonDirectory, function (err: string, files: any[]) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    files.forEach(function (file) {
      const jsonPath = join(typeDefinitionJsonDirectory, file);
      const moduleJson = readFileSync(jsonPath, "utf8");
      let data = JSON.parse(moduleJson);
      let patterns = data.moduleType.charAt(0).toUpperCase() + data.moduleType.slice(1);
      moduleTypes.push(patterns);
    });
    return showModuleSelector(uri, moduleTypes);
  });
}

/* display each module type to the user in a quickpick */
export async function showModuleSelector(uri: Uri, moduleTypes: any[]) {
  const opts: QuickPickOptions = { placeHolder: 'Select module pattern' };
  const selection = await window.showQuickPick(moduleTypes, opts);
  await getSelectedFolder(uri, selection.toLowerCase());
}

/* get module destination path and get module name */
export function getSelectedFolder(uri: Uri, moduleType: string) {
  const selectedFolder = uri.fsPath;
  const getUserInput = window.showInputBox({
    prompt: "Enter module name.",
    validateInput: (userInput) =>
      userInput.length > 0 ? "" : "Please provide a module name.",
  });
  getUserInput.then((moduleName) => {
    if (!moduleName) {
      return;
    }
    moduleName = moduleName.replace(/ /g, "-");
    copyTemplates(moduleName, moduleType, selectedFolder)
  });
}

/* temp code to copy template files from template directory to new module directory
to-do: use json info to copy files instead of hard-coding paths and types */
export function copyTemplates(moduleName: string, moduleType: string, selectedFolder: string) {
  let jsonPath = join(typeDefinitionJsonDirectory, `${moduleType}.json`);
  const moduleJson = readFileSync(jsonPath, "utf8");

  // module path and media placeholder
  const scaffoldModule = join(selectedFolder, moduleName);
  const mediaPlaceholder = join(extensionPath, "media", "docs-logo-ms.png");

  // module index
  const moduleYML = join(localTemplateRepoPath, "content-templates", "default-index.yml");

  // units
  const introductionMarkdown = join(localTemplateRepoPath, "content-templates", "default-introduction-unit.md");
  const learningContentYML = join(localTemplateRepoPath, "content-templates", "default-unit.yml");
  const knowledgeCheckStandaloneYML = join(localTemplateRepoPath, "content-templates", "default-knowledge-check-standalone-unit.yml");
  const exerciseYML = join(localTemplateRepoPath, "content-templates", "default-unit.yml");

  // includes
  const learningContentMarkdown = join(localTemplateRepoPath, "content-templates", "default-learning-content-unit.md");
  const exerciseMarkdown = join(localTemplateRepoPath, "content-templates", "default-exercise-unit.md");

  switch (moduleType) {
    case "choose":
      fse.copySync(moduleYML, join(scaffoldModule, "index.yml"));
      fse.copySync(mediaPlaceholder, join(scaffoldModule, "media", "docs-logo-ms.png"));

      fse.copySync(learningContentYML, join(scaffoldModule, "1-introduction.yml"));
      fse.copySync(introductionMarkdown, join(scaffoldModule, "includes", "1-introduction.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, `2-identify-${moduleName}-options.yml`));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", `2-identify-${moduleName}-options.md`));

      fse.copySync(learningContentYML, join(scaffoldModule, "3-analyze-decision-criteria.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "3-analyze-decision-criteria.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, "4-use-{product1}.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "4-use-{product1}.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, "5-use-{product2}.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "5-use-{product2}.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, "6-use-{product3}.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "6-use-{product3}.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, "7-use-{product4}.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "7-use-{product4}.md"));

      fse.copySync(knowledgeCheckStandaloneYML, join(scaffoldModule, "8-knowledge-check.yml"));

      fse.copySync(learningContentYML, join(scaffoldModule, "9-summary.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "9-summary.md"));
      break;
    case "introduction":
      fse.copySync(moduleYML, join(scaffoldModule, "index.yml"));
      fse.copySync(mediaPlaceholder, join(scaffoldModule, "media", "placeholder.png"));

      fse.copySync(learningContentYML, join(scaffoldModule, "1-introduction.yml"));
      fse.copySync(introductionMarkdown, join(scaffoldModule, "includes", "1-introduction.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, `2-what-is-${moduleName}.yml`));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", `2-what-is-${moduleName}.md`));

      fse.copySync(learningContentYML, join(scaffoldModule, `3-how-${moduleName}-works.yml`));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", `3-how-${moduleName}-works.md`));

      fse.copySync(learningContentYML, join(scaffoldModule, `4-when-to-use-${moduleName}.yml`));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", `4-when-to-use-${moduleName}.md`));

      fse.copySync(knowledgeCheckStandaloneYML, join(scaffoldModule, "5-knowledge-check.yml"));

      fse.copySync(learningContentYML, join(scaffoldModule, "6-summary.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "6-summary.md"));
      break;
    case "standard":
      fse.copySync(moduleYML, join(scaffoldModule, "index.yml"));
      fse.copySync(mediaPlaceholder, join(scaffoldModule, "media", "placeholder.png"));

      fse.copySync(learningContentYML, join(scaffoldModule, "1-introduction.yml"));
      fse.copySync(introductionMarkdown, join(scaffoldModule, "includes", "1-introduction.md"));

      fse.copySync(learningContentYML, join(scaffoldModule, "2-learning-content.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "2-learning-content.md"));

      fse.copySync(exerciseYML, join(scaffoldModule, "3-exercise.yml"));
      fse.copySync(exerciseMarkdown, join(scaffoldModule, "includes", "3-exercise.md"));

      fse.copySync(knowledgeCheckStandaloneYML, join(scaffoldModule, "5-knowledge-check.yml"));

      fse.copySync(learningContentYML, join(scaffoldModule, "5-summary.yml"));
      fse.copySync(learningContentMarkdown, join(scaffoldModule, "includes", "5-summary.md"));
      break;
  }
  generateBaseUid(scaffoldModule, moduleName);
}
