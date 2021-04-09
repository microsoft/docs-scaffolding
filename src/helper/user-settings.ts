"use-strict";

import { workspace } from "vscode";

// settings.json values
export async function getUserSetting(setting: string) {
  switch (setting) {
    case "alias":
        return workspace.getConfiguration("docs.scaffolding").alias;
    case "githubid":
      return workspace.getConfiguration("docs.scaffolding").githubid;
    case "prefix":
      return workspace.getConfiguration("docs.scaffolding").prefix;
    case "product":
      return workspace.getConfiguration("docs.scaffolding").product;
    case "template_repo":
      return workspace.getConfiguration("docs.scaffolding").template_repo;
  }
}
