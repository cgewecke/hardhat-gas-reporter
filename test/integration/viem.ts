// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { Deployment, GasReporterOutput, MethodData } from "../types";

import { useEnvironment, findMethod, findDeployment } from "../helpers";

describe("Viem", function () {
  let output: GasReporterOutput;
  let methods: MethodData;
  let deployments: Deployment[];

  const projectPath = path.resolve(
    __dirname,
    "../projects/viem"
  );

  const outputPath = path.resolve(
    __dirname,
    "../projects/viem/gasReporterOutput.json"
  );

  const network = undefined;
  const configPath = "./hardhat.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [] });
    output = require(outputPath);
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  })

  it ("should record transactions made with the publicClient", function(){
    const method = findMethod(methods, "Greeter", "setGreeting");
    assert.equal(method?.numberOfCalls, 1);
  });

  it ("should record transactions made with a walletClient", function(){
    const method = findMethod(methods, "Greeter", "asOther");
    assert.equal(method?.numberOfCalls, 1);
  });

  it ("should record deployments", function(){
    const deployment = findDeployment(deployments, "Greeter");
    assert.isNotNull(deployment);
    assert(deployment!.gasData.length > 0);
  });
});
