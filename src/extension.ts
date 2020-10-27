import { commands, ExtensionContext, Uri } from "vscode";
import { join } from "path";
import { getSelectedFolder, moveSelectionDown, moveSelectionUp } from './controllers/scaffolding-controller';

const fse = require("fs-extra");

export let extensionName: any;
export let templateFolder: any;

export async function activate(context: ExtensionContext) {
  let extensionPath = join(context.extensionPath, "package.json");
  extensionName = JSON.parse(fse.readFileSync(extensionPath, "utf8"));
  extensionPath = context.extensionPath;
  templateFolder = join(extensionPath, "template");
  const disposableScaffoldModule = commands.registerCommand(
    "scaffoldModule",
    async (uri: Uri) => {
      await getSelectedFolder(uri);
    }
  );
  const disposableMoveUp = commands.registerCommand(
    "moveSelectionUp",
    () => {
      moveSelectionUp();
    }
  );
  let disposableMoveDown = commands.registerCommand(
    "moveSelectionDown",
    () => {
      moveSelectionDown();
    }
  );


  context.subscriptions.push(
    disposableScaffoldModule,
    disposableMoveUp,
    disposableMoveDown
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
