import { HttpNetworkConfig, HardhatRuntimeEnvironment } from "hardhat/types";
import { EthGasReporterConfig } from "../types";

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {EthGasReporterConfig}
 */
function getDefaultOptions(hre: HardhatRuntimeEnvironment): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545";
  const defaultCompiler = hre.config.solidity.compilers[0]

  let url: any;
  // Resolve URL
  if ((<HttpNetworkConfig>hre.network.config).url) {
    url = (<HttpNetworkConfig>hre.network.config).url;
  } else {
    url = defaultUrl;
  }

  return {
    enabled: true,
    url: <string>url,
    metadata: {
      compiler: {
        version: defaultCompiler.version
      },
      settings: {
        optimizer: {
          enabled: defaultCompiler.settings.optimizer.enabled,
          runs: defaultCompiler.settings.optimizer.runs
        }
      }
    }
  }
}

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {any}
 */
export function getOptions(hre: HardhatRuntimeEnvironment): any {
  return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter };
}
