import { TASK_TEST } from "@nomiclabs/buidler/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { useEnvironment } from "./helpers";

// Only one of these tests can be run for now. TASK_TEST kills the process
// after running mocha. This should be fixed in Buidler v1.0.0-beta.9

describe.skip("Gas Reporter (Truffle plugin)", function() {
  useEnvironment(__dirname + "/buidler-truffle-project");

  it("using option - onlyCalledMethods: false", async function() {
    await this.env.run(TASK_TEST, { testFiles: ["test/etherrouter.js"] });
  });
});

describe("Gas Reporter (Ethers plugin)", function() {
  useEnvironment(__dirname + "/buidler-ethers-project");

  it("no options", async function() {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
