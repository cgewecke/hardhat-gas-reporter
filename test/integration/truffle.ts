import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { useEnvironment } from "./../helpers";

describe("Truffle plugin", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/hardhat-truffle-project"
  );
  useEnvironment(projectPath);

  it("default", async function () {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
