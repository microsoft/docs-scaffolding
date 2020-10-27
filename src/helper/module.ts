import { alias, gitHubID, learnRepoId } from "../userSettings";

const replace = require("replace-in-file");
let learnRepo: string = learnRepoId;
let author: string = gitHubID;
let msAuthor: string = alias;

export function renameModuleReferences(modulePath: string, moduleName: any) {
    const options = {
      files: `${modulePath}/*.yml`,
      from: /{{moduleName}}/g,
      to: moduleName,
    };
    const results = replace.sync(options);
    console.log("Replacement results:", results);
    renameRepoReferences(modulePath, moduleName);
  }
  
 function renameRepoReferences(modulePath: string, moduleName: any) {
    if (!learnRepo) {
      learnRepo = "learn";
    }
    const options = {
      files: `${modulePath}/*.yml`,
      from: /{{learRepo}}/g,
      to: learnRepo,
    };
    const results = replace.sync(options);
    console.log("Replacement results:", results);
    renameGithubIdReferences(modulePath, moduleName);
  }
  
  function renameGithubIdReferences(modulePath: string, moduleName: any) {
    if (!author) {
      author = "{{github}}";
    }
    const options = {
      files: `${modulePath}/*.yml`,
      from: /{{github}}/g,
      to: author,
    };
    const results = replace.sync(options);
    console.log("Replacement results:", results);
    renameGithubAuthorReferences(modulePath);
  }
  
  function renameGithubAuthorReferences(modulePath: string) {
    if (!msAuthor) {
      msAuthor = "{{msuser}}";
    }
    const options = {
      files: `${modulePath}/*.yml`,
      from: /{{msuser}}/g,
      to: msAuthor,
    };
    const results = replace.sync(options);
    console.log("Replacement results:", results);
  }