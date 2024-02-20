// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { DEFAULT_GAS_PRICE_API_URL } from "../../src/constants";
import { Deployment, GasReporterOptions, GasReporterOutput, MethodData } from "../types";

import { useEnvironment, findMethod, findDeployment } from "../helpers";

describe("Default Options", function () {
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
  const configPath = "./hardhat.default.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [] });
    output = require(outputPath);
    options = output.options;
    methods = output.data!.methods;
    deployments = output.data!.deployments;
  })

  it("default options", async function () {
    assert.equal(options.currency, "USD");
    assert.equal(options.enabled, true);
    assert.deepEqual(options.excludeContracts, []);
    assert.equal(options.gasPriceApi, DEFAULT_GAS_PRICE_API_URL);
    assert.equal(options.noColors, false);
    assert.equal(options.showUncalledMethods, false);
    assert.equal(options.rst, false);
    assert.equal(options.rstTitle, "");
    assert.equal(options.showMethodSig, false);
    assert.equal(options.token, "ETH");

    // Make sure we didn't hit endpoint
    assert.equal(options.gasPrice, undefined);
  });

  it ("should collect method data for contract names that shadow each other", function(){
    const dataItemA = findMethod(methods, "DuplicateA.sol:Duplicate", "a");
    const dataItemB = findMethod(methods, "DuplicateB.sol:Duplicate", "b");

    // Also checking that there's no doubling here
    assert(dataItemA!.numberOfCalls === 1);
    assert(dataItemB!.numberOfCalls === 1);
  });

  // methodThatThrows is called twice: success and failure - we should only see one call though.
  it ("should *not* record transactions that revert", function(){
    const dataItem = findMethod(methods, "VariableCosts", "methodThatThrows");

    assert.equal(dataItem?.numberOfCalls, 1)
  });

  // getBalance is called in the tests
  it ("should *not* record view/pure methods (by default)", function(){
    const dataItem = findMethod(methods, "VariableCosts", "getBalance");

    assert.equal(dataItem?.numberOfCalls, 0);
  });

  it ("should collect method data for multiple calls and set min, max, avg", function(){
    const dataItem = findMethod(methods, "VariableCosts", "addToMap");
    assert.equal(dataItem?.numberOfCalls, 4);
    assert.equal(dataItem?.gasData.length, 4);
    assert.exists(dataItem?.min);
    assert.exists(dataItem?.max);
    assert.exists(dataItem?.average);
    assert(dataItem!.min! < dataItem!.max!);
    assert(dataItem!.min! < dataItem!.average!);
    assert(dataItem!.average! < dataItem!.max!)
  });

  it("should collect deployment data for contracts with names that shadow each other", function(){
    const deploymentA = findDeployment(deployments, "DuplicateA.sol:Duplicate");
    const deploymentB = findDeployment(deployments, "DuplicateB.sol:Duplicate");

    assert(deploymentA!.gasData.length > 0);
    assert(deploymentB!.gasData.length > 0);
  });

  it("should collect deployment data for multiple deployments and set min, max, avg", function(){
    const deployment = findDeployment(deployments, "VariableConstructor");

    assert(deployment?.gasData!.length! > 1);
    assert.exists(deployment?.min);
    assert.exists(deployment?.max);
    assert.exists(deployment?.average);
    assert(deployment!.min! < deployment!.max!);
    assert(deployment!.min! < deployment!.average!);
    assert(deployment!.average! < deployment!.max!)
    assert(deployment!.percent! > 0);
  });
});
