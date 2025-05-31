import { cloneDeep } from "lodash" // used in extendConfig, cannot await import
import { EIP1193Provider, HardhatConfig, HardhatUserConfig } from "hardhat/types";
import { TASK_TEST, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import {
  extendConfig,
  extendEnvironment,
  extendProvider,
  task,
  subtask
} from "hardhat/config";

import "./type-extensions";
import { GasReporterExecutionContext, GasReporterOutput } from "./types";

import { getDefaultOptions } from './lib/options';
import { GasReporterProvider } from "./lib/provider";
import {
  TASK_GAS_REPORTER_MERGE,
  TASK_GAS_REPORTER_MERGE_REPORTS,
  TASK_GAS_REPORTER_MERGE_LEGACY,
  TASK_GAS_REPORTER_MERGE_REPORTS_LEGACY,
  TASK_GAS_REPORTER_START,
  TASK_GAS_REPORTER_STOP
} from "./task-names"

let _globalGasReporterProviderReference: GasReporterProvider;

// ========================
// EXTENSIONS
// ========================
/* Config */
extendConfig(
  (config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
    let options = getDefaultOptions(userConfig);

    // Deep clone userConfig otherwise HH will throw unauthorized modification error
    if (userConfig.gasReporter !== undefined) {
      options = Object.assign(options, cloneDeep(userConfig.gasReporter));

      // Use legacy Etherscan API Key if user did not migrate from deprecated options
      if (options.L1Etherscan && !options.etherscan) {
        options.etherscan = options.L1Etherscan
      }
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
   Initialize the provider with the execution context. This is called in
   `TASK_GAS_REPORTER_START` at the very end of setup. Provider extension above should
   not be used on unrelated tasks.
*/
export async function initializeGasReporterProvider(
  provider: EIP1193Provider,
  context: GasReporterExecutionContext
)  {
  // Other plugins (ex: hardhat-tracer) may wrap the provider in a way
  // that doesn't expose `init()`, so we init the underlying provider
  // here by making a cheap call.
  await provider.request({ method: "eth_blockNumber", params: []});
  _globalGasReporterProviderReference.initializeGasReporterProvider(context);
}

// ========================
// BUILT-IN OVERRIDES
// ========================

/**
 * Overrides Hardhat built-in task TASK_TEST to report gas usage
 */
task(TASK_TEST).setAction(
  async (args: any, hre, runSuper) => {
    hre.__hhgrec.task = TASK_TEST;
    await hre.run(TASK_GAS_REPORTER_START, args);
    await runSuper(args);
    await hre.run(TASK_GAS_REPORTER_STOP, args);
  }
);

// ========================
// GAS REPORTER TASKS
// ========================

/**
 * Initializes gas tracking
 */
subtask(TASK_GAS_REPORTER_START).setAction(
  async (args: any, hre) => {
    const options = hre.config.gasReporter;

    if (options.enabled === true) {
      // Lazy load all imports to minimize HH startup time
      const { getContracts } = await import("./lib/artifacts");
      const { Collector } = await import("./lib/collector");
      const { warnParallel } = await import("./utils/ui");

      // Temporarily skipping when in parallel mode because it crashes and
      // unsure how to resolve...
      if (args.parallel === true) {
        warnParallel();
        return;
      }

      // solidity-coverage disables gas reporter via mocha but that
      // no longer works for this version. (No warning necessary)
      if ((hre as any).__SOLIDITY_COVERAGE_RUNNING === true) {
        return;
      }

      // Need to compile so we have access to the artifact data.
      // This will rerun in TASK_TEST & TASK_RUN but should be a noop there.
      if (!args.noCompile) {
        await hre.run(TASK_COMPILE, { quiet: true });
      }

      const contracts = await getContracts(hre, options);

      hre.__hhgrec.usingCall = options.reportPureAndViewMethods;
      hre.__hhgrec.usingViem = (hre as any).viem;
      hre.__hhgrec.usingOZ  = (hre as any).upgrades || (hre as any).defender

      hre.__hhgrec.collector = new Collector(hre, options);
      hre.__hhgrec.collector.data.initialize(hre.network.provider, contracts);

      // Custom proxy resolvers are instantiated in the config,
      // OZ proxy resolver instantiated in Resolver constructor called by new Collector()
      hre.__hhgrec.methodIgnoreList = (options.proxyResolver)
        ? options.proxyResolver.ignore()
        : [];

      await initializeGasReporterProvider(hre.network.provider, hre.__hhgrec);
    }
  }
);

/**
 * Completes gas reporting: gets live market data, runs analysis and renders
 */
subtask(TASK_GAS_REPORTER_STOP).setAction(
  async (args: any, hre) => {
    const options = hre.config.gasReporter;

    if (
      options.enabled === true &&
      args.parallel !== true &&
      (hre as any).__SOLIDITY_COVERAGE_RUNNING !== true
    ) {
      const { setGasAndPriceRates } = await import("./utils/prices");
      const { render } = await import("./lib/render");

      const warnings = await setGasAndPriceRates(options);

      await hre.__hhgrec.collector?.data.runAnalysis(hre, options);
      render(hre, options, warnings);
    }
  }
);

/**
 * ========================
 * CLI COMMAND TASKS
 * ========================
 */

subtask(TASK_GAS_REPORTER_MERGE_REPORTS)
  .addOptionalVariadicPositionalParam(
    "inputFiles",
    "Path of several gasReporterOutput.json files to merge",
    []
  )
  .setAction(
    async ({ inputFiles }: { inputFiles: string[] }
  ): Promise<GasReporterOutput> => {
    const { subtaskMergeReportsImplementation } = await import("./tasks/mergeReports")
    return subtaskMergeReportsImplementation({ inputFiles })
  });

task(TASK_GAS_REPORTER_MERGE)
  .addOptionalParam(
    "output",
    "Target file to save the merged report",
    "gasReporterOutput.json"
  )
  .addVariadicPositionalParam(
    "input",
    "A list of JSON data files generated by the gas reporter plugin. " +
    "Files can be defined using glob patterns"
  )
  .setAction(async (taskArguments, hre) => {
    const { taskMergeImplementation } = await import("./tasks/mergeReports")
    return taskMergeImplementation(taskArguments, hre);
  });

/**
 * ========================
 * DEPRECATED TASKS
 * ========================
 */
task(TASK_GAS_REPORTER_MERGE_LEGACY)
.addOptionalParam(
  "output",
  "Target file to save the merged report",
  "gasReporterOutput.json"
)
.addVariadicPositionalParam("input")
.setAction(async () => {
  const { warnDeprecatedTask } = await import("./utils/ui");
  warnDeprecatedTask(TASK_GAS_REPORTER_MERGE)
});

subtask(TASK_GAS_REPORTER_MERGE_REPORTS_LEGACY)
.addOptionalVariadicPositionalParam("inputFiles", "", [])
.setAction(async ({}: { inputFiles: string[] }) => {
  const { warnDeprecatedTask } = await import("./utils/ui");
  warnDeprecatedTask(TASK_GAS_REPORTER_MERGE_REPORTS);
});

