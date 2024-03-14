import { writeFileSync } from "fs";
import { GasData } from "../gasData";
import { GasReporterOptions, GasReporterOutput } from "../../types";

/**
 * Writes acccumulated data and the current options to gasReporterOutput.json so it
 * can be consumed by other tools (CI etc...)
 * @param {GasData}               data
 * @param {GasReporterOptions}    options
 * @param {string}                toolchain
 */
export function generateJSONData(
  data: GasData,
  options: GasReporterOptions,
  toolchain="hardhat"
) {
  const pkg = require("../../../package.json");
  _sanitizeGasData(data, options);

  const output: GasReporterOutput = {
    namespace: "HardhatGasReporter",
    toolchain,
    version: pkg.version,
    options,
    data
  };

  writeFileSync(options.outputJSONFile!, JSON.stringify(output, null, ' '));
}

/**
 * Removes extraneous data and attached methods
 * @param {GasData} data
 * @param {GasReporterOptions} options
 */
function _sanitizeGasData(data: GasData, options: GasReporterOptions) {
  delete options.proxyResolver;

  delete (data as any).addressCache;
  delete (data as any).codeHashMap;
  delete data.provider;

  if (!options.includeBytecodeInJSON) {
    data.deployments.forEach(deployment => {
      delete (deployment as any).bytecode;
      delete (deployment as any).deployedBytecode;
    })
  }

  if (options.coinmarketcap){
    options.coinmarketcap = "[REDACTED]";
  }

  if (options.L1Etherscan){
    options.L1Etherscan = "[REDACTED]";
  }

  if (options.L2Etherscan){
    options.L2Etherscan = "[REDACTED]";
  }
}
