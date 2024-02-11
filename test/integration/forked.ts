import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { useEnvironment } from "./../helpers";

describe("Forked Network", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/hardhat-forked-project"
  );
  useEnvironment(projectPath);

  it("default", async function () {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
