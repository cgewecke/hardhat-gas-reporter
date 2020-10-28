import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import { useEnvironment } from "./helpers";

describe("Ethers plugin", function() {
  useEnvironment(__dirname + "/hardhat-ethers-project", "localhost");

  it("no options", async function() {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});
