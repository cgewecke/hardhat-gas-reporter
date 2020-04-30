import { TASK_TEST } from "@nomiclabs/buidler/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { useEnvironment } from "./helpers";

describe("Truffle plugin", function() {
  useEnvironment(__dirname + "/buidler-truffle-project", "development");

  it("default", async function() {
    this.env.config.gasReporter.onlyCalledMethods = true;
    await this.env.run(TASK_TEST, { testFiles: [] });
  });

  // There's a cacheing problem here probably....test runs ok alone.
  /*it("using option - onlyCalledMethods: false", async function() {
    await this.env.run(TASK_TEST, { testFiles: ["test/etherrouter.js"] });
  });*/
});
