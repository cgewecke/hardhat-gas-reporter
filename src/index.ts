import { TASK_TEST_RUN_MOCHA_TESTS } from "hardhat/builtin-tasks/task-names";
import { subtask } from "hardhat/config";
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins";
import {
  BackwardsCompatibilityProviderAdapter
} from "hardhat/internal/core/providers/backwards-compatibility"

import {
  EGRDataCollectionProvider,
  EGRAsyncApiProvider
} from "./providers";

import {
  HardhatArguments,
  HttpNetworkConfig,
  NetworkConfig,
  EthereumProvider,
  HardhatRuntimeEnvironment
} from "hardhat/types";

import "./type-extensions"
import { EthGasReporterConfig } from "./types";

let mochaConfig;

/**
 * Method passed to eth-gas-reporter to resolve artifact resources. Loads
 * and processes JSON artifacts
 * @param  {string} artifactPath `config.paths.artifacts`
 * @param  {string} contractName parsed contract name
 * @return {any}                 object w/ abi and bytecode
 */
function artifactor(artifacts: any, contractName : string) : any {
  const _artifact = artifacts.readArtifactSync(contractName)

  return {
    abi: _artifact.abi,
    bytecode: _artifact.bytecode,
    deployedBytecode: _artifact.deployedBytecode
  }
}

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {ResolvedHardhatConfig} config [description]
 * @param  {HardhatArguments}      args   [description]
 * @return {EthGasReporterConfig}         [description]
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
    artifactType: artifactor.bind(null, hre.artifacts),
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
 * @param  {ResolvedHardhatConfig} config
 * @param  {HardhatArguments}      args   command line args (e.g network)
 * @return {any}
 */
function getOptions(hre: HardhatRuntimeEnvironment): any {
  return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter };
}

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async (args: any, hre, runSuper) => {
    const options = getOptions(hre);

    if (options.enabled) {
      mochaConfig = hre.config.mocha || {};
      mochaConfig.reporter = "eth-gas-reporter";
      mochaConfig.reporterOptions = options;

      if (hre.network.name === HARDHAT_NETWORK_NAME || options.fast){
        const wrappedDataProvider= new EGRDataCollectionProvider(hre.network.provider,mochaConfig);
        hre.network.provider = new BackwardsCompatibilityProviderAdapter(wrappedDataProvider)
        mochaConfig.reporterOptions.provider = new EGRAsyncApiProvider(hre.network.provider);
        mochaConfig.reporterOptions.blockLimit = (<any>hre.network.config).blockGasLimit as number;
        mochaConfig.attachments = {};
      }

      hre.config.mocha = mochaConfig;
    }

    await runSuper();
  }
);

