// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";

import { GasReporterOutput, MethodData } from "../types";
import { useEnvironment, findMethod  } from "../helpers";

describe("Forked Networks: remoteContract, hardhat_reset", function () {
  let output: GasReporterOutput;
  let methods: MethodData;

  const projectPath = path.resolve(
    __dirname,
    "../projects/forked"
  );

  const outputPath = path.resolve(
    __dirname,
    "../projects/forked/gasReporterOutput.json"
  );

  const network = undefined;
  const configPath = "./hardhat.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [] });
    output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    methods = output.data!.methods;
  })

  after(() => execSync(`rm ${outputPath}`));

  it("calls remoteContract WETH.deposit", function(){
    const method = findMethod(methods, "WETH", "deposit");
    assert(method?.numberOfCalls! > 0);
  })

  it("preserves data about calls between hardhat_reset invocations", function(){
    const method = findMethod(methods, "ContractA", "sendFn");
    assert(method?.numberOfCalls! === 2);
  });
});
