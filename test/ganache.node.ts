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
});
