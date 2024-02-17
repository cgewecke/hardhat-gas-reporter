import { subtask } from "hardhat/config";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { TASK_GAS_REPORTER_START, TASK_GAS_REPORTER_STOP } from "../constants";

import { getContracts } from "../lib/artifacts";
import { setGasAndPriceRates } from "../utils/gas";
import { initGasReporterProvider} from "../extend";

import { Collector } from "../lib/collector";
import { GasDetailsTextTable} from "../lib/table"

/**
 * Initializes gas tracking
 */
subtask(TASK_GAS_REPORTER_START).setAction(
  async (args: any, hre, runSuper) => {
    const options = hre.config.gasReporter;

    if (options.enabled === true) {
      // Temporarily skipping when in parallel mode because it crashes and unsure how to resolve...
      if (args.parallel === true) {
        const result = await runSuper();
        console.log(
          "Note: Gas reporting has been skipped because plugin `hardhat-gas-reporter` " +
          "does not support the --parallel flag."
        );
        return result;
      }

      // We need to compile so we have access to the artifact data.
      // This will rerun in TASK_TEST & TASK_RUN but should be a noop there.
      if (!args.noCompile) {
        await hre.run(TASK_COMPILE, { quiet: true });
      }

      await setGasAndPriceRates(options);
      const contracts = await getContracts(hre, options);

      hre.__hhgrec.collector = new Collector(options, hre.network.provider);
      hre.__hhgrec.collector.data.initialize(options, hre.network.provider, contracts);

      await initGasReporterProvider(hre.network.provider, hre.__hhgrec);
    }
  }
);

/**
 * Initializes gas tracking
 */
subtask(TASK_GAS_REPORTER_STOP).setAction(
  async (args: any, hre) => {
    const options = hre.config.gasReporter;

    if (options.enabled === true && args.parallel !== true) {
      await hre.__hhgrec.collector?.data.runAnalysis(hre, options);
      const table = new GasDetailsTextTable();
      table.generate(hre, hre.__hhgrec.collector!.data, options);
    }
  }
);
