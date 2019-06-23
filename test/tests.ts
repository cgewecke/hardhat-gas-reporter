import { TASK_TEST } from "@nomiclabs/buidler/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { useEnvironment } from "./helpers";

describe("Gas Reporter (Truffle plugin)", function() {
  useEnvironment(__dirname + "/buidler-truffle-project");

  it("using option - onlyCalledMethods: false", async function() {
    await this.env.run(TASK_TEST, { testFiles: ["test/etherrouter.js"] });
  });
});

// This test has a typescript compilation error complaining that
// it can't resolve ethers from @nomiclabs/buidler. Base project
// (ethers-example) works fine on its own though.
describe.skip("Gas Reporter (Ethers plugin)", function() {
  useEnvironment(__dirname + "/buidler-ethers-project");

  it("no options", async function() {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
