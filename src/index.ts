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
  let url: string;

  if (config.networks[args.network]) {
    url = (<HttpNetworkConfig>config.networks[args.network]).url || defaultUrl;
  } else {
    // config.defaultNetwork is not Typed as of beta.8 ...
    // url = (<HttpNetworkConfig>config.networks[config.defaultNetwork]).url;
    url = defaultUrl;
  }

  return {
    artifactType: "buidler-v1",
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
