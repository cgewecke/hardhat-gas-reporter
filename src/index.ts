import { TASK_TEST_RUN_MOCHA_TESTS } from "@nomiclabs/buidler/builtin-tasks/task-names";
import { internalTask } from "@nomiclabs/buidler/config";
import { ensurePluginLoadedWithUsePlugin } from "@nomiclabs/buidler/plugins";
import {
  ResolvedBuidlerConfig,
  BuidlerArguments,
  HttpNetworkConfig
} from "@nomiclabs/buidler/types";

import { GasReporterConfig } from "./types";

ensurePluginLoadedWithUsePlugin();

function getDefaultConfig(
  config: ResolvedBuidlerConfig,
  args: BuidlerArguments
 ): GasReporterConfig {

  const defaultUrl = 'http://localhost:8545'
  let url : string;

  if (config.networks[args.network]){
    url = (<HttpNetworkConfig>config.networks[args.network]).url || defaultUrl;
  } else {
    // There's a type complaint about config.defaultNetwork here
    // Not published as of beta.8 ...
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

function getConfig(config: ResolvedBuidlerConfig, args: BuidlerArguments): any {
  const defaultConfig = getDefaultConfig(config, args);
  return { ...defaultConfig, ...(<any>config).gasReporter };
}

export default function() {
  internalTask(TASK_TEST_RUN_MOCHA_TESTS)
    .setAction(async (args : any, { config }, runSuper) => {
      const options = getConfig(config, args);

      if (options.enabled){
        const mochaConfig = config.mocha || {};

        mochaConfig.reporter = 'eth-gas-reporter';
        mochaConfig.reporterOptions = options;

        config.mocha = mochaConfig;
      }

      await runSuper(args);
    });
}
