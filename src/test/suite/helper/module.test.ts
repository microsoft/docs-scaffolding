import * as chai from 'chai';
import * as spies from 'chai-spies';
import { resolve } from 'path';
import { sleep, sleepTime } from '../../test.common/common';
import { generateBaseUid, stubModuleReferences, stubRepoReferences, stubGithubIdReferences, stubGithubAuthorReferences, stubDateReferences, stubUnitReferences } from '../../../helper/module';
import * as moduleHelper from './../../../helper/module';

chai.use(spies);
const expect = chai.expect;
const modulePath = resolve(__dirname, '../../../../src/test/data/repo/articles');

suite('Module Helper', () => {
	test('Generate UID', async () => {
		const spy = chai.spy.on(moduleHelper, 'generateBaseUid');
		generateBaseUid(modulePath, 'test-module', 'standard', 'Test Module');
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
    });
    test('Stub module references', async () => {
		const spy = chai.spy.on(moduleHelper, 'stubModuleReferences');
		stubModuleReferences(modulePath, 'test-module');
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
    });
    test('Stub module references', async () => {
		const spy = chai.spy.on(moduleHelper, 'stubRepoReferences');
		stubRepoReferences(modulePath);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
    });
    test('Stub Github ID references', async () => {
		const spy = chai.spy.on(moduleHelper, 'stubGithubIdReferences');
		stubGithubIdReferences(modulePath);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
    });
    test('Stub MS alias references', async () => {
		const spy = chai.spy.on(moduleHelper, 'stubGithubAuthorReferences');
		stubGithubAuthorReferences(modulePath);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
    });
    test('Stub date references', async () => {
		const spy = chai.spy.on(moduleHelper, 'stubDateReferences');
		stubDateReferences(modulePath);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
    });
    test('Stub unit references', async () => {
		const spy = chai.spy.on(moduleHelper, 'stubUnitReferences');
		stubUnitReferences(modulePath);
		await sleep(sleepTime);
		expect(spy).to.have.been.called();
	});
});