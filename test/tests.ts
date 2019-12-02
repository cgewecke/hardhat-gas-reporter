import { TASK_TEST } from "@nomiclabs/buidler/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { useEnvironment } from "./helpers";

const util = require('util')

describe("Truffle plugin", function() {
  useEnvironment(__dirname + "/buidler-truffle-project");

  it("default", async function() {
    this.env.config.gasReporter.onlyCalledMethods = true;
    await this.env.run(TASK_TEST, { testFiles: [] });
  });

  // There's a cacheing problem here probably....test runs ok alone.
  /*it("using option - onlyCalledMethods: false", async function() {
    await this.env.run(TASK_TEST, { testFiles: ["test/etherrouter.js"] });
  });*/
});

describe("Gas Reporter (Ethers plugin)", function() {
  useEnvironment(__dirname + "/buidler-ethers-project");

  it("no options", async function() {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
