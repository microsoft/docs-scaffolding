import * as chai from 'chai';
import * as spies from 'chai-spies';
import { commands } from 'vscode';
import { scaffoldModule, scaffoldingeCommand } from '../../../controllers/scaffolding-controller';
import * as common from '../../../helper/common';

chai.use(spies);
const expect = chai.expect;

suite('Scaffolding Controller', () => {
	// Reset and tear down the spies
	teardown(() => {
		chai.spy.restore(common);
	});
	suiteTeardown(async () => {
		await commands.executeCommand('workbench.action.closeAllEditors');
	});
	test('Scaffolding Command', () => {
		const controllerCommands = [{ command: scaffoldModule.name, callback: scaffoldModule }];
		expect(scaffoldingeCommand()).to.deep.equal(controllerCommands);
	});
});