import { commands, ExtensionContext } from "vscode";
import { scaffoldingCommand } from "./controllers/scaffolding-controller";
import { downloadTemplateZip } from "./controllers/template-controller";
import { Reporter } from "./helper/telemetry";

export let extensionPath: any;
export const telemetryError: string = "error";

export async function activate(context: ExtensionContext) {
  extensionPath = context.extensionPath;
  context.subscriptions.push(new Reporter(context));
  downloadTemplateZip();
  const ScaffoldingCommands: any = [];
  scaffoldingCommand().forEach((cmd) => ScaffoldingCommands.push(cmd));
  try {
    ScaffoldingCommands.map((cmd: any) => {
      const commandName = cmd.command;
      const command = commands.registerCommand(commandName, cmd.callback);
      context.subscriptions.push(command);
    });
  } catch (error) {
    console.log(
      `Error registering commands with vscode extension context: ${error}`
    );
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
