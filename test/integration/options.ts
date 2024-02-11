import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { useEnvironment } from "./../helpers";

// A place to test options
describe("Truffle plugin: gasReporter", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/hardhat-truffle-project"
  );
  useEnvironment(projectPath);

  it("gasReporter options", async function () {
    // Expect everything in the EtherRouter folder to be missing from report
    (this.env.config as any).gasReporter.excludeContracts = ["EtherRouter/"];
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
