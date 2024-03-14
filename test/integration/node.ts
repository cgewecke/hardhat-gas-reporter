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
    if(!process.env.STAND_ALONE) this.skip();

    await this.env.run(TASK_TEST, { testFiles: [] });
    output = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    options = output.options;
  })

  it("wrote to file", function () {
    if(!process.env.STAND_ALONE) this.skip();

    const outputFileOption = options.outputFile;
    const outputFilePath = path.resolve(
      __dirname,
      `../projects/options/${outputFileOption!}`
    );

    const file = fs.readFileSync(outputFilePath, "utf8");
    console.log(file);
  });
});
