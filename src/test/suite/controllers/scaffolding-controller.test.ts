/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as chai from "chai";
import * as spies from "chai-spies";
import { resolve } from "path";
import { commands, workspace, Uri } from "vscode";
import { sleep, sleepTime } from "../../test.common/common";
import sinon = require("sinon");
import * as scaffoldingController from "./../../../controllers/scaffolding-controller";
import {
  moduleSelectionQuickPick,
  scaffoldingCommand,
  scaffoldModule,
  copyTemplates,
  moveSelectionUp,
  moveSelectionDown,
  insertNewUnit,
  deleteUnit,
  renameUnit,
  getSelectedFolder,
  formatModuleName,
} from "../../../controllers/scaffolding-controller";

chai.use(spies);
const expect = chai.expect;

const uri = Uri.file(
  resolve(
    __dirname,
    "../../../../src/test/data/repo/articles/sample-markdown.md"
  )
);
const contextSelectedFolder = resolve(
  __dirname,
  "../../../../src/test/data/repo/articles"
);

suite("Scaffolding Controller", () => {
  suiteSetup(() => {
    sinon.stub(workspace, "getConfiguration").returns({
      get: () => true,
      has: () => true,
      inspect: () => {
        return { key: "" };
      },
      update: () => Promise.resolve(),
    });
  });
  suiteTeardown(async () => {
    await commands.executeCommand("workbench.action.closeAllEditors");
    sinon.restore();
  });
  test("Scaffolding Command", () => {
    const controllerCommands = [
      { command: scaffoldModule.name, callback: scaffoldModule },
      { command: moveSelectionDown.name, callback: moveSelectionDown },
      { command: moveSelectionUp.name, callback: moveSelectionUp },
      { command: insertNewUnit.name, callback: insertNewUnit },
      { command: deleteUnit.name, callback: deleteUnit },
      { command: renameUnit.name, callback: renameUnit },
    ];
    expect(scaffoldingCommand()).to.deep.equal(controllerCommands);
  });
  test("Module selector", async () => {
    const spy = chai.spy.on(scaffoldingController, "moduleSelectionQuickPick");
    moduleSelectionQuickPick(uri);
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Copy templates", async () => {
    const spy = chai.spy.on(scaffoldingController, "copyTemplates");
    copyTemplates(
      "modified title",
      "test module",
      "choose",
      contextSelectedFolder
    );
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Get selected folder", async () => {
    const spy = chai.spy.on(scaffoldingController, "getSelectedFolder");
    getSelectedFolder(uri, "standard");
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Format module name", async () => {
    const output = formatModuleName("Create a service", "a", "");
    await sleep(sleepTime);
    expect(output).to.equal("create-service");
  });
  test("Move selection down", async () => {
    const spy = chai.spy.on(scaffoldingController, "moveSelectionDown");
    moveSelectionDown(uri);
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Move selection up", async () => {
    const spy = chai.spy.on(scaffoldingController, "moveSelectionUp");
    moveSelectionUp(uri);
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Insert new unit", async () => {
    const spy = chai.spy.on(scaffoldingController, "insertNewUnit");
    insertNewUnit(uri);
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Delete unit", async () => {
    const spy = chai.spy.on(scaffoldingController, "deleteUnit");
    deleteUnit(uri);
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
  test("Rename unit", async () => {
    const spy = chai.spy.on(scaffoldingController, "renameUnit");
    renameUnit(uri);
    await sleep(sleepTime);
    expect(spy).to.have.been.called();
  });
});
