import { writeFileSync } from "fs";
import { GasData } from "../gasData";
import { GasReporterOptions, GasReporterOutput } from "../../types";

/**
 * Writes acccumulated data and the current options to gasReporterOutput.json so it
 * can be consumed by other tools (CI etc...)
 * @param  {Object} data  GasData instance
 */
export function generateJSONData(data: GasData, options: GasReporterOptions) {
  delete data.provider;

  const output: GasReporterOutput = {
    namespace: "HardhatGasReporter",
    options,
    data
  };

  writeFileSync(options.outputJSONFile!, JSON.stringify(output));
}
