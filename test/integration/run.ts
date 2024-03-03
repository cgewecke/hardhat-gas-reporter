// eslint-disable-next-line import/no-extraneous-dependencies
// TODO: REMOVE LINT DISABLE
/* eslint-disable */
import { assert } from "chai";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { TASK_RUN } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { Deployment, GasReporterOutput, MethodData } from "../types";

import { useEnvironment, findMethod, findDeployment } from "../helpers";

describe.skip("Flashswap (TASK_HARDHAT_RUN)", function () {
  let output: GasReporterOutput;
  let methods: MethodData;
  let deployments: Deployment[];

  const projectPath = path.resolve(
    __dirname,
    "../projects/run"
  );

  const outputPath = path.resolve(
    __dirname,
    "../projects/run/gasReporterOutput.json"
  );

  const network = undefined;
  const configPath = "./hardhat.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_RUN, { script: "script.ts"  });
    output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  })

  after(() => execSync(`rm ${outputPath}`));

  it ("should print", () => {
  });
});
