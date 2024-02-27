// eslint-disable-next-line import/no-extraneous-dependencies
// TODO: REMOVE LINT DISABLE
/* eslint-disable */
import { assert } from "chai";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";
import { Deployment, GasReporterOptions, GasReporterOutput, MethodData } from "../types";

import { useEnvironment, findMethod, findDeployment } from "../helpers";

describe("Options E", function () {
  let output: GasReporterOutput;
  let options: GasReporterOptions;
  let methods: MethodData;
  let deployments: Deployment[];

  const projectPath = path.resolve(
    __dirname,
    "../projects/options"
  );

  const outputPath = path.resolve(
    __dirname,
    "../projects/options/gasReporterOutput.json"
  );

  const network = undefined;
  const configPath = "./hardhat.options.e.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [] });
    output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    options = output.options;
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  })

  after(() => execSync(`rm ${outputPath}`));

  it("prints", function () {
  });
});
