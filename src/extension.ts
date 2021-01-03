import { commands, ExtensionContext, workspace, window } from "vscode";
import { scaffoldingCommand } from './controllers/scaffolding-controller';
import { downloadTemplateZip } from './controllers/github-controller';
import { Reporter } from './helper/telemetry';

export let extensionPath: any;

export async function activate(context: ExtensionContext) {
	extensionPath = context.extensionPath;
	context.subscriptions.push(new Reporter(context));
	downloadTemplateZip();
	const ScaffoldingCommands: any = [];
	scaffoldingCommand().forEach(cmd => ScaffoldingCommands.push(cmd));
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
			e.affectsConfiguration(`${extensionName}.githubid`) ||
			e.affectsConfiguration(`${extensionName}.alias`) ||
			e.affectsConfiguration(`${extensionName}.prefix`) ||
			e.affectsConfiguration(`${extensionName}.template_repo`) ||
			e.affectsConfiguration(`${extensionName}.product`)
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
