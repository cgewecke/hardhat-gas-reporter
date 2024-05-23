// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { readFileSync } from "fs";
import { execSync } from "child_process";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";
import { Deployment, GasReporterOptions, GasReporterOutput, MethodData } from "../types";

import { useEnvironment, findMethod, findDeployment } from "../helpers";

/**
 * OPTIONS ARE SET UP TO TEST:
 * + Complex compiler details
 * + Non-ethereum L1 (polygon) with live market price
 * + Custom gasPrice API call
 * + Exclude contracts from reporting
 * + Display full method signature
 * + Dark mode
 * + RST titles
 * + Gas deltas
 */
describe("Options A", function () {
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
  const configPath = "./hardhat.options.a.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [] });
    output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    options = output.options;
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  });

  after(() => execSync(`rm ${outputPath}`));

  it("fetched a currency price", function () {
    assert.exists(options.tokenPrice);
    assert.isNumber(parseFloat(options.tokenPrice!));
  });

  it("fetched a gas price", function() {
    assert.exists(options.gasPrice);
    assert.isNumber(options.gasPrice);
  });

  it("calculates costs for method calls", function(){
    const method = findMethod(methods, "VariableCosts", "addToMap");
    assert.isNumber(parseFloat(method!.cost!));
  });

  it("calculates costs for deployments", function(){
    const deployment = findDeployment(deployments, "VariableConstructor");
    assert.isNumber(parseFloat(deployment!.cost!));
  });

  it("includes bytecode and deployedBytecode in deployment data", function(){
    const deployment = findDeployment(deployments, "VariableConstructor");
    assert.isString(deployment?.bytecode);
    assert.isString(deployment?.deployedBytecode);
  });

  it("excludes `excludedContracts` from report", function(){
    const deployment = findDeployment(deployments, "EtherRouter");
    assert.isNull(deployment);
  });

  it("resolves shadowed method calls with the example proxy resolver", function(){
    const methodA = findMethod(methods, "VersionA", "setValue");
    const methodB = findMethod(methods, "VersionB", "setValue");

    assert.equal(methodA?.numberOfCalls, 1);
    assert.equal(methodB?.numberOfCalls, 1);
  });

  it("calculates gas deltas for methods and deployments", async function(){
    process.env.GAS_DELTA = "true";
    await this.env.run(TASK_TEST, { testFiles: [] });
    process.env.GAS_DELTA = "";

    const _output = JSON.parse(readFileSync(options.cachePath!, 'utf-8'));
    const _methods = _output.data!.methods;
    const _deployments = _output.data!.deployments;
    const _options = _output.options;

    const method = findMethod(_methods, "VariableCosts", "addToMap");
    const deployment = findDeployment(_deployments, "VariableConstructor");


    if (_options.cachePath) {
      try {
        execSync(`rm ${_options.cachePath}`)
      } catch {}
    }

    assert.isNumber(method!.executionGasAverageDelta!);
    assert.notEqual(method!.executionGasAverageDelta!, 0);

    assert.isNumber(deployment!.executionGasAverage);
    assert.notEqual(deployment!.executionGasAverageDelta, 0);
  });

});
