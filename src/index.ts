import { readFileSync } from "fs";
import { TASK_TEST_RUN_MOCHA_TESTS } from "@nomiclabs/buidler/builtin-tasks/task-names";
import { internalTask } from "@nomiclabs/buidler/config";
import { ensurePluginLoadedWithUsePlugin, BUIDLEREVM_NETWORK_NAME } from "@nomiclabs/buidler/plugins";

import {
  ResolvedBuidlerConfig,
  BuidlerArguments,
  HttpNetworkConfig,
  NetworkConfig
} from "@nomiclabs/buidler/types";

import { EthGasReporterConfig } from "./types";

ensurePluginLoadedWithUsePlugin();

/**
 * Method passed to eth-gas-reporter to resolve artifact resources. Loads
 * and processes JSON artifacts
 * @param  {string} artifactPath `config.paths.artifacts`
 * @param  {string} contractName parsed contract name
 * @return {any}                 object w/ abi and bytecode
 */
function artifactor(artifactPath: string, contractName : string) : any {
  let _artifact: any = {};
  let file : string = `${artifactPath}/${contractName}.json`;

  try {
    _artifact = JSON.parse(readFileSync(file, "utf-8"));
  } catch(err){
    throw err;
  }

  return {
    abi: _artifact.abi,
    bytecode: _artifact.bytecode,
    deployedBytecode: _artifact.deployedBytecode
  }
}

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (buidler)
 * > solc compiler info
 * @param  {ResolvedBuidlerConfig} config [description]
 * @param  {BuidlerArguments}      args   [description]
 * @return {EthGasReporterConfig}         [description]
 */
function getDefaultOptions(
  config: ResolvedBuidlerConfig,
  networkConfig: NetworkConfig
): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545";

  let url: any;
  let artifactType: any;

  // Resolve URL
  if ((<HttpNetworkConfig>networkConfig).url) {
    url = (<HttpNetworkConfig>networkConfig).url;
  } else {
    url = defaultUrl;
  }

  return {
    artifactType: artifactor.bind(null, config.paths.artifacts),
    enabled: true,
    url: <string>url,
    metadata: {
      compiler: {
        version: config.solc.version
      },
      settings: {
        optimizer: {
          enabled: config.solc.optimizer.enabled,
          runs: config.solc.optimizer.runs
        }
      }
    }
  };
}

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {ResolvedBuidlerConfig} config
 * @param  {BuidlerArguments}      args   command line args (e.g network)
 * @return {any}
 */
function getOptions(
  config: ResolvedBuidlerConfig,
  networkConfig: NetworkConfig
): any {
  return { ...getDefaultOptions(config, networkConfig), ...(<any>config).gasReporter };
}

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
export default function() {
  internalTask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
    async (args: any, { config, network }, runSuper) => {
      const options = getOptions(config, network.config);

      if (options.enabled) {
        if (network.name === BUIDLEREVM_NETWORK_NAME) {
          console.warn("buidler-gas-reporter doesn't work with an in-memory instance of Buidler EVM")
          console.warn("To learn how to use it, please go to https://github.com/cgewecke/buidler-gas-reporter#using-buidlerevm-warning")
        } else {
          const mochaConfig = config.mocha || {};

          mochaConfig.reporter = "eth-gas-reporter";
          mochaConfig.reporterOptions = options;

          config.mocha = mochaConfig;
        }
      }

      await runSuper();
    }
  );
}
