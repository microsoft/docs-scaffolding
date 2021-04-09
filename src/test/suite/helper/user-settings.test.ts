import * as chai from "chai";
import * as spies from "chai-spies";
import { getUserSetting } from "../../../helper/user-settings";

chai.use(spies);
const expect = chai.expect;
suite("User settings", () => {
  test("Get alias setting", async () => {
    const alias = await getUserSetting("alias");
    expect(alias).to.equal(alias);
  });
  test("Get default github setting", async () => {
    const githubid = await getUserSetting("githubid");
    expect(githubid).to.equal(githubid);
  });
  test("Get default prefix setting", async () => {
    const prefix = await getUserSetting("prefix");
    expect(prefix).to.equal(prefix);
  });
  test("Get default product setting", async () => {
    const product = await getUserSetting("product");
    expect(product).to.equal(product);
  });
  test("Get default repo setting", async () => {
    const template_repo = await getUserSetting("template_repo");
    expect(template_repo).to.equal(
      "https://github.com/MicrosoftDocs/learn-scaffolding/archive/main.zip"
    );
  });
});
