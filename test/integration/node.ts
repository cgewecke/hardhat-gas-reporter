import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { useEnvironment } from "./../helpers";

describe("Ethers plugin", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/hardhat-ethers-project"
  );
  useEnvironment(projectPath, "localhost");

  it("no options", async function () {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
