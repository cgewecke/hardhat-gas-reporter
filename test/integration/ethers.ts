import path from "path"
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import { useEnvironment } from "./../helpers";

describe("Ethers plugin", function() {
  const projectPath = path.resolve(__dirname, "../projects/hardhat-ethers-project");
  useEnvironment(projectPath);

  it("no options", async function() {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
