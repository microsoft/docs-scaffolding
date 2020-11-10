import { alias, gitHubID, defaultPrefix } from "../helper/user-settings";
import { basename, join } from 'path';
import { postError, postInformation } from '../helper/common';

const replace = require("replace-in-file");
let learnRepo: string = defaultPrefix;
let author: string = gitHubID;
let msAuthor: string = alias;

export function generateBaseUid(modulePath: string, moduleName: any, moduleType: string, rawTitle: string) {
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
  stubRepoReferences(modulePath);
}

export function stubRepoReferences(modulePath: string) {
  if (!learnRepo) {
    learnRepo = "learn";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{learnRepo}}/g,
    to: learnRepo,
  };
  replace.sync(options);
  stubGithubIdReferences(modulePath);
}

export function stubGithubIdReferences(modulePath: string) {
  if (!author) {
    author = "{{githubUsername}}";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{githubUsername}}/g,
    to: author,
  };
  replace.sync(options);
  stubGithubAuthorReferences(modulePath);
}

export function stubGithubAuthorReferences(modulePath: string) {
  if (!msAuthor) {
    msAuthor = "{{msUser}}";
  }
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{msUser}}/g,
    to: msAuthor,
  };
  replace.sync(options);
  stubDateReferences(modulePath);
}

export function stubDateReferences(modulePath: string) {
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

export function stubUnitReferences(modulePath: string) {
  const fs = require("fs");
  fs.readdir(modulePath, function (err: string, files: any[]) {
    if (err) {
      return postError("Unable to scan directory: " + err);
    }
    files.forEach(function (file) {
      let unitFilePath = join(modulePath, file);
      let unitName = basename(unitFilePath.replace('.yml', ''));

      // include/content values should use filenames
      let options = {
        files: `${modulePath}/${unitName}.yml`,
        from: /includes\/{{unitName}}/g,
        to: `includes/${unitName}`,
      };
      replace.sync(options);

      // remove numbers from uid
      const regex = /^([0-9]*)-/gm;
      let formattedUnitName = unitName.replace(regex, '');
      options = {
        files: `${modulePath}/${unitName}.yml`,
        from: /{{unitName}}/g,
        to: formattedUnitName,
      };
      replace.sync(options);
    });
    const moduleName = basename(modulePath);
    postInformation(`Successfully created : ${moduleName}`);
  });
}