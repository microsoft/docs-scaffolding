/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as chai from 'chai';
import * as spies from 'chai-spies';
import { resolve } from 'path';
import {
	commands,
	workspace,
	Uri} from 'vscode';
import { sleep, sleepTime } from '../../test.common/common';
import sinon = require('sinon');
import * as scaffoldingController from './../../../controllers/scaffolding-controller';
import {
	moduleSelectionQuickPick, scaffoldingeCommand, scaffoldModule, copyTemplates
} from '../../../controllers/scaffolding-controller';

chai.use(spies);
const expect = chai.expect;

const uri = Uri.file(resolve(__dirname, '../../../../src/test/data/repo/articles/sample-markdown.md'));
const contextSelectedFolder = resolve(__dirname, '../../../../src/test/data/repo/articles');

suite('Scaffolding Controller', () => {
	suiteSetup(() => {
		sinon.stub(workspace, 'getConfiguration').returns({
			get: () => true,
			has: () => true,
			inspect: () => {
				return { key: '' };
			},
			update: () => Promise.resolve()
		});
	});
	suiteTeardown(async () => {
		await commands.executeCommand('workbench.action.closeAllEditors');
		sinon.restore();
	});
	test('Scaffolding Command', () => {
		const controllerCommands = [{ command: scaffoldModule.name, callback: scaffoldModule }];
		expect(scaffoldingeCommand()).to.deep.equal(controllerCommands);
	});
	test('Module selector', async () => {
		const spy = chai.spy.on(scaffoldingController, 'moduleSelectionQuickPick');
		moduleSelectionQuickPick(uri);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
	});
	test('Copy templates', async () => {
		const spy = chai.spy.on(scaffoldingController, 'copyTemplates');
		copyTemplates('test module', 'choose', contextSelectedFolder);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
	});
});
