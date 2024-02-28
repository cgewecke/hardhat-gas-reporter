// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { Deployment, GasReporterOutput, MethodData } from "../types";

import { useEnvironment, findMethod, findDeployment } from "../helpers";

describe.skip("OZ Upgrades", function () {
  let output: GasReporterOutput;
  let methods: MethodData;
  let deployments: Deployment[];

  const projectPath = path.resolve(
    __dirname,
    "../projects/oz"
  );

  const outputPath = path.resolve(
    __dirname,
    "../projects/oz/gasReporterOutput.json"
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

  it ("should record shadowed transactions made with proxied upgrade", function(){
    const firstBoxMethod = findMethod(methods, "ProxyBox", "setBox");
    const secondBoxMethod = findMethod(methods, "ProxyBoxV2", "setBox");

    assert.equal(firstBoxMethod?.numberOfCalls, 1);
    assert.equal(secondBoxMethod?.numberOfCalls, 1);
  });

  it ("should record deployments made with proxied upgrade", function(){
    const firstBoxDeployment = findDeployment(deployments, "ProxyBox");
    const secondBoxDeployment = findDeployment(deployments, "ProxyBoxV2");

    assert.isNotNull(firstBoxDeployment);
    assert.isNotNull(secondBoxDeployment);

    assert(firstBoxDeployment!.gasData.length > 0);
    assert(secondBoxDeployment!.gasData.length > 0)
  });

  it ("should record shadowed transactions made with beacon proxy", function(){
    const firstBoxMethod = findMethod(methods, "BeaconBox", "setBox");
    const secondBoxMethod = findMethod(methods, "BeaconBoxV2", "setBox");

    assert.equal(firstBoxMethod?.numberOfCalls, 1);
    assert.equal(secondBoxMethod?.numberOfCalls, 1);
  });

  it ("should record deployments made with proxied upgrade", function(){
    const firstBoxDeployment = findDeployment(deployments, "BeaconBox");
    const secondBoxDeployment = findDeployment(deployments, "BeaconBoxV2");

    assert.isNotNull(firstBoxDeployment);
    assert.isNotNull(secondBoxDeployment);

    assert(firstBoxDeployment!.gasData.length > 0);
    assert(secondBoxDeployment!.gasData.length > 0)
  });
});
