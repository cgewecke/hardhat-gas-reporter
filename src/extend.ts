import { cloneDeep } from "lodash"
import { extendConfig, extendEnvironment, extendProvider } from "hardhat/config";
import { EIP1193Provider, HardhatConfig, HardhatUserConfig } from "hardhat/types";

import "./type-extensions";

import { getDefaultOptions } from './lib/options';
import { GasReporterProvider } from "./lib/provider";
import { GasReporterExecutionContext } from "./types";

let _globalGasReporterProviderReference: GasReporterProvider;


/* Config */
extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    let options = getDefaultOptions(userConfig);

    // Deep clone userConfig otherwise HH will throw unauthorized modification error
    if (userConfig.gasReporter !== undefined) {
      options = Object.assign(options, cloneDeep(userConfig.gasReporter));
    }
    (config as any).gasReporter = options;
  }
);

/* Environment */
extendEnvironment((hre) => {
  hre.__hhgrec = {
    collector: undefined,
    task: undefined,
  }
});

/* Provider */
extendProvider(async (provider) => {
  const newProvider = new GasReporterProvider(provider);
  _globalGasReporterProviderReference = newProvider;
  return newProvider;
});

/*
   Initialize the provider with the execution context. This is called in `TASK_GAS_REPORTER_START`
   at the very end of setup. Provider extension above should not be used on unrelated tasks.
*/
export async function initializeGasReporterProvider(
  provider: EIP1193Provider,
  context: GasReporterExecutionContext
)  {
  await (provider as any).init()
  _globalGasReporterProviderReference.initializeGasReporterProvider(context);
}
