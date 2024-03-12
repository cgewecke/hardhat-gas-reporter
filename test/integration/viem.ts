// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { execSync } from "child_process";
import { readFileSync } from "fs";
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
    output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  })

  after(() => execSync(`rm ${outputPath}`));

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

  it ("should record methods executed with eth_call", function(){
    const greet = findMethod(methods, "Greeter", "greet");

    assert.equal(greet?.numberOfCalls, 2);
    assert.equal(greet?.executionGasAverage, 3475);
  });

  it ("should filter auto generated getters", () => {
    const greeting = findMethod(methods, "Greeter", "greeting");
    const urGreeting1 = findMethod(methods, "Greeter", "urGreeting");
    const urGreeting2 = findMethod(methods, "EmphaticGreeter", "urGreeting");

    assert.isNull(greeting);
    assert.isNull(urGreeting1);
    assert.isNull(urGreeting2);
  })
});
