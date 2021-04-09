/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as chai from "chai";
import { resolve } from "path";
import { window } from "vscode";
import {
  postWarning,
  postInformation,
  postError,
  showStatusMessage,
  getModuleUid,
  getModuleTitleTemplate,
  returnJsonData,
  replaceUnitPlaceholderWithTitle,
  getUnitTitle,
  publishedUidCheck,
  getUnitUid,
  updateUnitUid,
  replaceUnitPatternPlaceholder,
  formatModuleName
} from "../../../helper/common";

const expect = chai.expect;

suite("Common", () => {
  suiteTeardown(async () => {
    // revert replacement strings after tests finish
    const replace = require("replace-in-file");
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit-template.yml"
    );
		let options = {
			files: filePath,
			from: /^title:\s.*/gm,
			to: `title: {{unitName}} # stub from default unit name`,
		};
		replace.sync(options);
    options = {
			files: filePath,
			from: /type:\s.*/gm,
			to: `type: {{patternType}} # stub based on selected scaffold: introduction | learning_content | exercise | summary`,
		};
    replace.sync(options);
    options = {
			files: filePath,
			from: /^uid:\s.*/gm,
			to: `uid: {{learnRepo}}.{{moduleName}}.{{unitName}} # stub from prefix + module folder name + default unit name`,
		};
    replace.sync(options);
	});
  test("postWarning showWarning is called", async () => {
    const spy = chai.spy(window.showWarningMessage);
    postWarning("message");
    expect(spy).to.be.have.been.called;
  });
  test("postInformation showInformation is called", async () => {
    const spy = chai.spy(window.showInformationMessage);
    postInformation("message");
    expect(spy).to.be.have.been.called;
  });
  test("postError showErrorMessage is called", async () => {
    const spy = chai.spy(window.showErrorMessage);
    postError("message");
    expect(spy).to.be.have.been.called;
  });
  test("showStatusMessage is called", async () => {
    const output = window.createOutputChannel("docs-scaffolding");
    const spy = chai.spy(output.appendLine);
    showStatusMessage("message");
    expect(spy).to.be.have.been.called;
  });
  test("Get module uid", async () => {
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/modules"
    );
    const uid = getModuleUid(filePath);
    expect(uid).to.equal("learn-wwl.responsible-conversational-ai");
  });
  test("Get module title template", async () => {
    const filePath = resolve(__dirname, "../../../../src/test/data/repo");
    const templateTitle = getModuleTitleTemplate(filePath, "introduction");
    expect(templateTitle).to.equal("Introduction to {product}");
  });
  test("returnJsonData is called", async () => {
    const spy = chai.spy(returnJsonData);
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/learn-scaffolding-main/module-type-definitions/introduction.json"
    );
    returnJsonData(filePath);
    expect(spy).to.be.have.been.called;
  });
  test("Title placeholder", async () => {
    const spy = chai.spy(replaceUnitPlaceholderWithTitle);
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit-template.yml"
    );
    replaceUnitPlaceholderWithTitle(filePath, "foo");
    expect(spy).to.be.have.been.called;
  });
  test("Get unit title", async () => {
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit.yml"
    );
    const title = getUnitTitle(filePath);
    expect(title).to.equal("Ensure your bot is reliable");
  });
  test("Title replacement", async () => {
    const spy = chai.spy(replaceUnitPlaceholderWithTitle);
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit-template.yml"
    );
    replaceUnitPlaceholderWithTitle(filePath, "foo");
    expect(spy).to.be.have.been.called;
  });
/*   test("Published uid check", async () => {
    const spy = chai.spy(publishedUidCheck);
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit-template.yml"
    );
    publishedUidCheck(
      "learn-wwl.responsible-conversational-ai.ensure-bot-reliability",
      "foo",
      filePath,
      filePath
    );
    expect(spy).to.be.have.been.called;
  }); */
  test("Get unit uid", async () => {
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit.yml"
    );
    const uid = getUnitUid(filePath);
    expect(uid).to.equal(
      "learn-wwl.responsible-conversational-ai.ensure-bot-reliability"
    );
  });
  test("Update unit uid", async () => {
    const spy = chai.spy(updateUnitUid);
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit-template.yml"
    );
    updateUnitUid(
      "learn-wwl.responsible-conversational-ai.ensure-bot-reliability",
      filePath,
      filePath
    );
    expect(spy).to.be.have.been.called;
  });
  test("Replace unit pattern placeholder", async () => {
    const spy = chai.spy(replaceUnitPatternPlaceholder);
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/units/unit-template.yml"
    );
    replaceUnitPatternPlaceholder(filePath, "excercise");
    expect(spy).to.be.have.been.called;
  });
  test("Format module name", async () => {
    const filePath = resolve(
      __dirname,
      "../../../../src/test/data/repo/learn-scaffolding-main/terms.json"
    );
    const moduleName = "Choose the best Service For Your Application";
    const moduleFolderName = formatModuleName(moduleName, filePath);
    expect(moduleFolderName).to.equal("choose-best-service-for-your-app");
  });
});
