import { alias, gitHubID, learnRepoId } from "../userSettings";
import { basename, join, parse } from 'path';
import { postInformation } from '../helper/common';

const replace = require("replace-in-file");
let learnRepo: string = learnRepoId;
let author: string = gitHubID;
let msAuthor: string = alias;

export function generateBaseUid(modulePath: string, moduleName: any) {
  if (!learnRepo) {
    learnRepo = "learn";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{moduleName}}/g,
    to: moduleName,
  };
  replace.sync(options);
  stubModuleReferences(modulePath, moduleName);
}

export function stubModuleReferences(modulePath: string, moduleName: any) {
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{moduleName}}/g,
    to: moduleName,
  };
  replace.sync(options);
  stubRepoReferences(modulePath, moduleName);
}

function stubRepoReferences(modulePath: string, moduleName: any) {
  if (!learnRepo) {
    learnRepo = "learn";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{learRepo}}/g,
    to: learnRepo,
  };
  replace.sync(options);
  stubGithubIdReferences(modulePath, moduleName);
}

function stubGithubIdReferences(modulePath: string, moduleName: any) {
  if (!author) {
    author = "{{github}}";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{github}}/g,
    to: author,
  };
  replace.sync(options);
  stubGithubAuthorReferences(modulePath);
}

function stubGithubAuthorReferences(modulePath: string) {
  if (!msAuthor) {
    msAuthor = "{{msuser}}";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{msuser}}/g,
    to: msAuthor,
  };
  replace.sync(options);
  stubDateReferences(modulePath);
}

function stubDateReferences(modulePath: string) {
  let date: any = new Date(Date.now());
  date = date.toLocaleDateString();
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{msDate}}/g,
    to: date,
  };
  replace.sync(options);
  stubUnitReferences(modulePath);
}

function stubUnitReferences(modulePath: string) {
  const fs = require("fs");
  fs.readdir(modulePath, function (err: string, files: any[]) {
    //handling error
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }
    //listing all files using forEach
    files.forEach(function (file) {
      let unitFilePath = join(modulePath, file);
      let unitName = basename(unitFilePath.replace('.yml', ''));
      const options = {
        files: `${modulePath}/${unitName}.yml`,
        from: /{{unitName}}/g,
        to: unitName,
      };
      replace.sync(options);
    });
    const moduleName = basename(modulePath);
    postInformation(`Successfully created : ${moduleName}`);
  });
}