import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { useEnvironment } from "./../helpers";

describe("Waffle plugin with signers", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/hardhat-waffle-project"
  );
  useEnvironment(projectPath);

  it("no options", async function () {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
