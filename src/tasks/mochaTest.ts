import { TASK_TEST_RUN_MOCHA_TESTS } from "hardhat/builtin-tasks/task-names";
import { subtask } from "hardhat/config";
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins";

import { getContracts, getResolvedRemoteContracts } from "../utils/artifacts";
import { getOptions } from "../utils/options";
import { wrapProviders } from "../utils/providers";

import "../type-extensions";
import { RemoteContract } from "../types";

let mochaConfig;
let resolvedQualifiedNames: string[] = [];
let resolvedRemoteContracts: RemoteContract[] = [];

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async (args: any, hre, runSuper) => {
    let options = getOptions(hre);

    if (options.enabled === true) {
      // Temporarily skipping when in parallel mode because it crashes and unsure how to resolve...
      if (args.parallel === true) {
        const result = await runSuper();
        console.log(
          "Note: Gas reporting has been skipped because plugin `hardhat-gas-reporter` does not support " +
            "the --parallel flag."
        );
        return result;
      }

      const { setGasAndPriceRates } = require("eth-gas-reporter/lib/utils");
      const InternalReporterConfig = require("eth-gas-reporter/lib/config");

      // Fetch data from gas and coin price providers
      const originalOptions = options;
      options = new InternalReporterConfig(originalOptions);
      await setGasAndPriceRates(options);

      mochaConfig = hre.config.mocha;

      if (hre.network.name === HARDHAT_NETWORK_NAME) {
        const { asyncProvider } = await wrapProviders(
          hre,
          mochaConfig
        );

        resolvedRemoteContracts = await getResolvedRemoteContracts(
          asyncProvider,
          originalOptions.remoteContracts
        );

        resolvedQualifiedNames =
          await hre.artifacts.getAllFullyQualifiedNames();

        options.getContracts = getContracts.bind(
          null,
          hre.artifacts,
          options.excludeContracts,
          resolvedRemoteContracts,
          resolvedQualifiedNames
        );

        mochaConfig.reporter = "eth-gas-reporter";
        mochaConfig.reporterOptions = options;
        mochaConfig.reporterOptions.provider = asyncProvider;
        mochaConfig.reporterOptions.blockLimit = (hre.network.config as any)
          .blockGasLimit as number;
        (mochaConfig as any).attachments = {};
      }

      hre.config.mocha = mochaConfig;
    }

    return runSuper();
  }
);
