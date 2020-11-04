import { commands, ExtensionContext, Uri } from "vscode";
import { join } from "path";
import { scaffoldModule } from './controllers/scaffolding-controller';

export async function activate(context: ExtensionContext) {
  let extensionPath = join(context.extensionPath, "package.json");
  extensionPath = context.extensionPath;
  const disposableScaffoldModule = commands.registerCommand(
    "scaffoldModule",
    async (uri: Uri) => {
      await scaffoldModule(uri);
    }
  );

  context.subscriptions.push(
    disposableScaffoldModule
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
