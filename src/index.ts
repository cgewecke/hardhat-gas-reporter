import { readFileSync } from "fs";
import { TASK_TEST_RUN_MOCHA_TESTS } from "@nomiclabs/buidler/builtin-tasks/task-names";
import { internalTask } from "@nomiclabs/buidler/config";
import { ensurePluginLoadedWithUsePlugin } from "@nomiclabs/buidler/plugins";

import {
  ResolvedBuidlerConfig,
  BuidlerArguments,
  HttpNetworkConfig
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
    bytecode: `0x${_artifact.bytecode}`
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
  args: BuidlerArguments
): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545";
  const defaultNetwork = (<any>config).defaultNetwork;

  let url: any;
  let artifactType: any;

  // Resolve URL
  if (config.networks[args.network]) {
    url = (<HttpNetworkConfig>config.networks[args.network]).url || defaultUrl;
  } else if (defaultNetwork) {
    url = (<HttpNetworkConfig>config.networks[defaultNetwork]).url;
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
  args: BuidlerArguments
): any {
  return { ...getDefaultOptions(config, args), ...(<any>config).gasReporter };
}

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
export default function() {
  internalTask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
    async (args: any, { config }, runSuper) => {
      const options = getOptions(config, args);

      if (options.enabled) {
        const mochaConfig = config.mocha || {};

        mochaConfig.reporter = "eth-gas-reporter";
        mochaConfig.reporterOptions = options;

        config.mocha = mochaConfig;
      }

      await runSuper();
    }
  );
}
