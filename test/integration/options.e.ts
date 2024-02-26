// eslint-disable-next-line import/no-extraneous-dependencies
// TODO: REMOVE LINT DISABLE
/* eslint-disable */
import { assert } from "chai";
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

  const variableCostsPath = path.resolve(
    __dirname,
    "../projects/options/test/variableCosts.ts"
  );

  const walletPath = path.resolve(
    __dirname,
    "../projects/options/test/wallet.ts"
  );

  const network = undefined;
  const configPath = "./hardhat.options.e.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [variableCostsPath, walletPath] });
    output = require(outputPath);
    options = output.options;
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  })

  it("prints", function () {
  });
});
