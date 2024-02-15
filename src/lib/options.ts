import { HardhatRuntimeEnvironment } from "hardhat/types";

import { HardhatGasReporterOptions } from "../types";

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {HardhatGasReporterOptions}
 */
function getDefaultOptions(
  hre: HardhatRuntimeEnvironment
): HardhatGasReporterOptions {
  const compiler = hre.config.solidity.compilers[0];

  return {
    enabled: true,
    blockLimit: (hre.network.config as any).blockGasLimit as number,
    solcConfig: {
      version: compiler.version,
      settings: {
        optimizer: {
          enabled: compiler.settings.optimizer.enabled,
          runs: compiler.settings.optimizer.runs,
        },
      },
    },
  };
}

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {any}
 */
export function getOptions(hre: HardhatRuntimeEnvironment): any {
  return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter };
}
