import { cloneDeep } from "lodash"
import { extendConfig, extendEnvironment, extendProvider } from "hardhat/config";
import { EIP1193Provider, HardhatConfig, HardhatUserConfig } from "hardhat/types";

import "./type-extensions";

import { getDefaultOptions } from './lib/options';
import { GasReporterProvider } from "./lib/providers";
import { GasReporterExecutionContext } from "./types";

let _globalGasReporterProviderReference: GasReporterProvider;

/* Initialize the provider with the execution context */
export async function initGasReporterProvider(provider: EIP1193Provider, context: GasReporterExecutionContext)  {
  await (provider as any).init()
  _globalGasReporterProviderReference._setGasReporterExecutionContext(context);
}

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
