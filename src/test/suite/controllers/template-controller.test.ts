/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as chai from 'chai';
import * as spies from 'chai-spies';
import {
	commands,
	workspace
} from 'vscode';
import { sleep, sleepTime } from '../../test.common/common';
import sinon = require('sinon');
import * as templateController from '../../../controllers/template-controller';
import {
	downloadTemplateZip, unzipTemplates
} from '../../../controllers/template-controller';

chai.use(spies);
const expect = chai.expect;

suite('Template Controller', () => {
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
	test('Download template zip file', async () => {
		const spy = chai.spy.on(templateController, 'downloadTemplateZip');
		downloadTemplateZip();
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
	});
	test('Unzip downloaded repo zip', async () => {
		const spy = chai.spy.on(templateController, 'unzipTemplates');
		unzipTemplates();
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
	});
});
