import { alias, gitHubID, defaultPrefix, defaultProduct } from "../helper/user-settings";
import { basename, join } from 'path';
import { postError, postInformation } from '../helper/common';

const replace = require("replace-in-file");
let learnRepo: string = defaultPrefix;
let author: string = gitHubID;
let msAuthor: string = alias;

export function generateBaseUid(modulePath: string, moduleName: any, moduleType: string, rawTitle: string) {
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{moduleName}}.*/g,
    to: moduleName,
  };
  replace.sync(options);
  stubModuleIndex(modulePath, moduleName, moduleType, rawTitle);
}

export function stubModuleIndex(modulePath: string, moduleName: any, moduleType: string, rawTitle: string) {
  let options = {
    files: `${modulePath}/index.yml`,
    from: /{{patternType}}.*/g,
    to: moduleType,
  };
  replace.sync(options);
  options = {
    files: `${modulePath}/index.yml`,
    from: /title:.*/gm,
    to: `title: ${rawTitle}`,
  };
  replace.sync(options);
  stubModuleReferences(modulePath, moduleName);
}

export function stubModuleReferences(modulePath: string, moduleName: any) {
  const options = {
    files: `${modulePath}/*.yml`,
    from: /{{moduleName}}.*/g,
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
    from: /{{githubUsername}}.*/g,
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
    from: /{{msUser}}.*/g,
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
    from: /{{msDate}}.*/g,
    to: date,
  };
  replace.sync(options);
  stubUnitReferences(modulePath);
}

export function stubUnitReferences(modulePath: string) {
  const fs = require("fs");
  let unitBlock: string[] = [];
  let moduleName: string;
  let formattedUnitName: string;
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
        from: /includes\/{{unitName}}.*/g,
        to: `includes/${unitName}`,
      };
      replace.sync(options);

      // remove numbers from uid
      const regex = /^([0-9]*)-/gm;
      formattedUnitName = unitName.replace(regex, '');
      options = {
        files: `${modulePath}/${unitName}.yml`,
        from: /{{unitName}}.*/g,
        to: formattedUnitName,
      };
      replace.sync(options);

      moduleName = basename(modulePath);
      if (!["includes", "index", "media"].includes(formattedUnitName)) {
        unitBlock.push(`  - ${moduleName}.${formattedUnitName}\n`);
      }
    });
    stubUnitBlock(moduleName, modulePath, unitBlock);
  });
}

export function stubUnitBlock(moduleName: string, modulePath: string, unitBlock: any) {
  let unitList = unitBlock.join(" ");
  let options = {
    files: `${modulePath}/index.yml`,
    from: /\s?{{units}}/g,
    to: unitList,
  };
  replace.sync(options);
  stubProductBlock(moduleName, modulePath);
}

export function stubProductBlock(moduleName: string, modulePath: string) {
  let options = {
    files: `${modulePath}/index.yml`,
    from: /\s?{{product}}/g,
    to: `  - ${defaultProduct}`,
  };
  replace.sync(options);
  moduleCleanup(moduleName, modulePath);
}

export function moduleCleanup(moduleName: string, modulePath: string) {
  // cleanup remaining stub comments
  let options = {
    files: `${modulePath}/index.yml`,
    from: /#\s?stub.*/g,
    to: ` `,
  };
  replace.sync(options);
  // remove any blank lines
  options = {
    files: `${modulePath}/index.yml`,
    from: /^\s*\n/gm,
    to: ` `,
  };
  replace.sync(options);
  postInformation(`Successfully created : ${moduleName}`);
}