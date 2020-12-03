import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";

import { useEnvironment } from "./helpers";

// A place to test options
describe("Truffle plugin: gasReporter", function() {
  useEnvironment(__dirname + "/hardhat-truffle-project");

  it("gasReporter options", async function() {
    // Expect everything in the EtherRouter folder to be missing from report
    (this.env.config as any).gasReporter.excludeContracts = ['EtherRouter/']
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});