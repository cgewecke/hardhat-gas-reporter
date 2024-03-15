import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { useEnvironment } from "../helpers";

describe("--parallel", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/viem"
  );

  const network = undefined;
  const configPath = "./hardhat.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { parallel: true, testFiles: [] });
  })

  it ("should complete successfully", function(){});
});
