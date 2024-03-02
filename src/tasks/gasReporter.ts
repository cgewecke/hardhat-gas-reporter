import { subtask } from "hardhat/config";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { TASK_GAS_REPORTER_START, TASK_GAS_REPORTER_STOP } from "../constants";

import { getContracts } from "../lib/artifacts";
import { setGasAndPriceRates } from "../utils/prices";
import { initGasReporterProvider} from "../extend";

import { Collector } from "../lib/collector";
import { render } from "../lib/render"
import { warnParallel } from "../utils/ui";

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
        warnParallel();
        return result;
      }

      // Need to compile so we have access to the artifact data.
      // This will rerun in TASK_TEST & TASK_RUN but should be a noop there.
      if (!args.noCompile) {
        await hre.run(TASK_COMPILE, { quiet: true });
      }
      const contracts = await getContracts(hre, options);

      hre.__hhgrec.usingCall = options.reportPureAndViewMethods;
      hre.__hhgrec.usingViem = (hre as any).viem !== undefined;
      hre.__hhgrec.usingOZ  = ((hre as any).upgrades !== undefined) || ((hre as any).defender !== undefined)

      hre.__hhgrec.collector = new Collector(hre, options);
      hre.__hhgrec.collector.data.initialize(options, hre.network.provider, contracts);

      // Custom proxy resolvers are instantiated in the config,
      // OZ proxy resolver instantiated in Resolver constructor called by new Collector()
      hre.__hhgrec.methodIgnoreList = (options.proxyResolver !== undefined)
        ? options.proxyResolver.ignore()
        : [];

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
      const warnings = await setGasAndPriceRates(options);

      await hre.__hhgrec.collector?.data.runAnalysis(hre, options);
      render(hre, options, warnings);
    }
  }
);
