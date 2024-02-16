import { extendConfig, extendEnvironment, extendProvider } from "hardhat/config";
import { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import "./type-extensions";
import { getDefaultOptions } from './lib/options';
import { GasReporterProvider } from "./lib/providers";
import { GasReporterExecutionContext } from "./types";

let _globalGasReporterProviderReference: GasReporterProvider;

/* Initialize the provider with the execution context */
export function initGasReporterProvider(context: GasReporterExecutionContext)  {
  _globalGasReporterProviderReference._setGasReporterExecutionContext(context);
}

/* Config */
extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    let options = getDefaultOptions();

    if (userConfig.gasReporter !== undefined) {
      options = Object.assign(options, userConfig.gasReporter);
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
