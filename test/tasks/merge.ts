// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import fs from "fs";
import path from "path";

import { TASK_GAS_REPORTER_MERGE } from "../../src/task-names";

import { useEnvironment } from "./../helpers";

const loadJsonFile = (filepath) =>
  JSON.parse(fs.readFileSync(filepath, "utf-8"));

describe("Merge gasRerpoterOutput.json files task", function () {
  const projectPath = path.resolve(
    __dirname,
    "../projects/hardhat-merge-project"
  );

  useEnvironment(projectPath);

  it("should merge gas reporter output files", async function () {
    const expected = loadJsonFile(
      path.resolve(projectPath, "gasReporterOutput.expected.json")
    );

    await this.env.run(TASK_GAS_REPORTER_MERGE, {
      input: ["gasReporterOutput-*.json"],
    });

    const result = loadJsonFile(
      path.resolve(projectPath, "gasReporterOutput.json")
    );

    assert.deepEqual(result, expected);
  });
});
