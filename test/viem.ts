import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import { useEnvironment } from "./helpers";

describe("Viem plugin with signers", function() {
  useEnvironment(__dirname + "/hardhat-viem-project");

  it("no options", async function() {
    await this.env.run(TASK_TEST, { testFiles: [] });
  });
});

