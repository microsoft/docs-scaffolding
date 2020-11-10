import { commands, ExtensionContext, workspace, window } from "vscode";
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
	// if the user changes scaffolding settings.json, display message telling them to reload.
	const extensionName = 'docs.scaffolding';
	workspace.onDidChangeConfiguration((e: any) => {
		if (
			e.affectsConfiguration(
				`${extensionName}.githubid` ||
				`${extensionName}.alias` ||
				`${extensionName}.learn_repo_id` ||
				`${extensionName}.product` ||
				`${extensionName}.template_repo`
			)
		) {
			window
				.showInformationMessage(
					'Your updated configuration has been recorded, but you must reload to see its effects.',
					'Reload'
				)
				.then(result => {
					if (result === 'Reload') {
						commands.executeCommand('workbench.action.reloadWindow');
					}
				});
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }
