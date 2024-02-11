import fs from "fs"
import path from "path"
import { TASK_TEST_RUN_MOCHA_TESTS } from "hardhat/builtin-tasks/task-names";
import { task, subtask } from "hardhat/config";
import { HARDHAT_NETWORK_NAME, HardhatPluginError } from "hardhat/plugins";

import type {
  getProviders,
  EGRAsyncApiProvider as EGRAsyncApiProviderT
} from "./utils/providers";

import "./tasks/merge-reports";

import {
  HardhatArguments,
  HttpNetworkConfig,
  NetworkConfig,
  EthereumProvider,
  HardhatRuntimeEnvironment,
  Artifact,
  Artifacts
} from "hardhat/types";

import "./type-extensions"
import { EthGasReporterConfig, EthGasReporterOutput, RemoteContract } from "./types";
import { getOptions } from "./utils/options";
import { getContracts, getResolvedRemoteContracts } from "./utils/artifacts";

let mochaConfig;
let resolvedQualifiedNames: string[]
let resolvedRemoteContracts: RemoteContract[] = [];

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async (args: any, hre, runSuper) => {

    let options = getOptions(hre);
    options.getContracts = getContracts.bind(
       null,
       hre.artifacts,
       options.excludeContracts,
       resolvedRemoteContracts
    );

    if (options.enabled) {
      // Temporarily skipping when in parallel mode because it crashes and unsure how to resolve...
      if (args.parallel === true) {
        const result = await runSuper();
        console.log(
          "Note: Gas reporting has been skipped because plugin `hardhat-gas-reporter` does not support " +
          "the --parallel flag."
        );
        return result;
      }

      const { parseSoliditySources, setGasAndPriceRates } = require('eth-gas-reporter/lib/utils');
      const InternalReporterConfig  = require('eth-gas-reporter/lib/config');

      // Fetch data from gas and coin price providers
      const originalOptions = options
      options = new InternalReporterConfig(originalOptions);
      await setGasAndPriceRates(options);

      mochaConfig = hre.config.mocha || {};
      mochaConfig.reporter = "eth-gas-reporter";
      mochaConfig.reporterOptions = options;

      if (hre.network.name === HARDHAT_NETWORK_NAME || options.fast){

        const { wrappedDataProvider, asyncProvider } = getProviders(hre);

        const {
          BackwardsCompatibilityProviderAdapter
        } = await import("hardhat/internal/core/providers/backwards-compatibility")

        const {
          EGRDataCollectionProvider,
          EGRAsyncApiProvider
        } = await import("./utils/providers");

        const wrappedDataProvider= new EGRDataCollectionProvider(hre.network.provider,mochaConfig);
        hre.network.provider = new BackwardsCompatibilityProviderAdapter(wrappedDataProvider);

        const asyncProvider = new EGRAsyncApiProvider(hre.network.provider);
        resolvedRemoteContracts = await getResolvedRemoteContracts(
          asyncProvider,
          originalOptions.remoteContracts
        );

        mochaConfig.reporterOptions.provider = asyncProvider;
        mochaConfig.reporterOptions.blockLimit = (<any>hre.network.config).blockGasLimit as number;
        mochaConfig.attachments = {};
      }

      hre.config.mocha = mochaConfig;
      resolvedQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames();
    }

    return runSuper();
  }
);


