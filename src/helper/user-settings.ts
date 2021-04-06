"use-strict";

import { workspace } from "vscode";

// settings.json values
export let gitHubID: string;
export let alias: string;
export let defaultPrefix: string;
export let templateRepo: string = workspace.getConfiguration("docs.scaffolding")
  .template_repo;
export let defaultProduct: string;

export async function getUserSettings() {
  console.log("get updated user settings");
  gitHubID = workspace.getConfiguration("docs.scaffolding").githubid;
  alias = workspace.getConfiguration("docs.scaffolding").alias;
  defaultPrefix = workspace.getConfiguration("docs.scaffolding").prefix;
  templateRepo = workspace.getConfiguration("docs.scaffolding").template_repo;
  defaultProduct = workspace.getConfiguration("docs.scaffolding").product;
}

export async function getUserSetting(setting: string) {
  console.log("get updated user settings");
  switch (setting) {
    case "githubid":
      return workspace.getConfiguration("docs.scaffolding").githubid;
    case "alias":
      return workspace.getConfiguration("docs.scaffolding").alias;
    case "prefix":
      return workspace.getConfiguration("docs.scaffolding").prefix;
    case "product":
      return workspace.getConfiguration("docs.scaffolding").product;
  }
}
