import { commands, ExtensionContext } from "vscode";
import { scaffoldingeCommand } from './controllers/scaffolding-controller';

export let extensionPath: any;

export async function activate(context: ExtensionContext) {
  extensionPath = context.extensionPath;
  const ScaffoldingCommands: any = [];
	scaffoldingeCommand().forEach(cmd => ScaffoldingCommands.push(cmd));

	try {
		ScaffoldingCommands.map((cmd: any) => {
			const commandName = cmd.command;
			const command = commands.registerCommand(commandName, cmd.callback);
			context.subscriptions.push(command);
		});
	} catch (error) {
		console.log(`Error registering commands with vscode extension context: ${error}`);
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
