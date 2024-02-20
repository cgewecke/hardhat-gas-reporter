import { TASK_TEST } from "hardhat/builtin-tasks/task-names";
import path from "path";
import fs from "fs";
import { GasReporterOptions, GasReporterOutput } from "../types";

import { useEnvironment } from "./../helpers";

describe("Independent Node: Hardhat", function () {
  let output: GasReporterOutput;
  let options: GasReporterOptions;

  const projectPath = path.resolve(
    __dirname,
    "../projects/options"
  );
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

  it("wrote to file", function () {
    const outputFileOption = options.outputFile;
    const outputFilePath = path.resolve(
      __dirname,
      `../projects/options/${outputFileOption!}`
    );

    const file = fs.readFileSync(outputFilePath, "utf8");
    console.log(file);
  });
});
