// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { TASK_GAS_REPORTER_MERGE, TASK_GAS_REPORTER_MERGE_LEGACY } from "../../src/task-names";

import { useEnvironment } from "./../helpers";

const loadJsonFile = (filepath: any) =>
  JSON.parse(fs.readFileSync(filepath, "utf-8"));

describe("Merge gasRerpoterOutput.json files task", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/merge"
  );

  const outputPath = path.resolve(
    __dirname,
    "../projects/merge/gasReporterOutput.json"
  );

  useEnvironment(projectPath);

  after(() => execSync(`rm ${outputPath}`));

  it("should merge gas reporter output files", async function () {
    const expected = loadJsonFile(
      path.resolve(projectPath, "mergeOutput.expected.json")
    );

    await this.env.run(TASK_GAS_REPORTER_MERGE, {
      input: ["mergeOutput-*.json"],
    });

    const result = loadJsonFile(outputPath);

    // Sanitize gas/price rates and other variable quantities
    delete result.options.coinmarketcap;
    delete expected.options.coinmarketcap;

    delete result.version;
    delete expected.version;

    delete result.options.tokenPrice;
    delete expected.options.tokenPrice;

    delete result.options.outputJSONFile;
    delete expected.options.outputJSONFile;

    delete result.data.blockLimit;
    delete expected.data.blockLimit;

    for (const key of Object.keys(result.data.methods)) {
      delete result.data.methods[key].cost;
      delete expected.data.methods[key].cost;
    }

    for (const deployment of result.data.deployments) {
      delete deployment.cost;
    }

    for (const deployment of expected.data.deployments) {
      delete deployment.cost;
    }

    assert.deepEqual(result, expected);
  });

  it("should error on malformatted files", async function() {
    try {
      await this.env.run(TASK_GAS_REPORTER_MERGE, {
        input: ["malformatted-*.json"],
      });
      assert.fail("test failed")
    } catch (err: any) {
      assert(err.message.includes("requires property \"options\""))
    }
  });

  it("should display a deprecated task warning when running legacy tasks", async function(){
    await this.env.run(TASK_GAS_REPORTER_MERGE_LEGACY, {
      input: ["mergeOutput-*.json"],
    });
  });
});
