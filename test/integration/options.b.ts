import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import path from "path";
import fs from "fs";
import { GasReporterOptions, GasReporterOutput } from "../types";

import { useEnvironment } from "../helpers";

describe("Options B", function () {
  let output: GasReporterOutput;
  let options: GasReporterOptions;

  const projectPath = path.resolve(
    __dirname,
    "../projects/options"
  );

  // NB: test sets the outputJSONFile option
  const outputPath = path.resolve(
    __dirname,
    "../projects/options/gas.json"
  );

  const network = undefined;
  const configPath = "./hardhat.options.b.config.ts";

  useEnvironment(projectPath, network, configPath);

  before(async function(){
    await this.env.run(TASK_TEST, { testFiles: [] });
    output = require(outputPath);
    options = output.options;
  })

  it("set the options correctly", function(){
    assert.equal(options.token, "ETC");
    assert.equal(options.tokenPrice, "200.00");
    assert.equal(options.gasPrice, 40);
  });

  it("wrote table to file", function () {
    const outputFileOption = options.outputFile;
    const outputFilePath = path.resolve(
      __dirname,
      `../projects/options/${outputFileOption!}`
    );

    const file = fs.readFileSync(outputFilePath, "utf8");
    console.log(file);
  });
});