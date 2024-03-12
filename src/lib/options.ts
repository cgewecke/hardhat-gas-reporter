import { HardhatUserConfig } from "hardhat/types";
import {
  // TODO: enable when arbitrum support added
  // DEFAULT_ARBITRUM_HARDFORK,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_DISPLAY_PRECISION,
  DEFAULT_JSON_OUTPUT_FILE,
  DEFAULT_OPTIMISM_HARDFORK,
  TABLE_NAME_TERMINAL
} from "../constants";

import { /* ArbitrumHardfork,*/ GasReporterOptions, OptimismHardfork } from "../types";

/**
 * Validates Optimism hardfork option
 * @param hardfork
 * @returns {boolean}
 */
function isOptimismHardfork(hardfork: string | undefined) {
  if (hardfork === undefined) return false;

  return ["bedrock, ecotone"].includes(hardfork);
}

// TODO: Enabled when arbitrum support added
/**
 * Validates Arbitrum hardfork option
 * @param hardfork
 * @returns
 */
// function isArbitrumHardfork(hardfork: string | undefined) {
//  if (hardfork === undefined) return false;

//  return ["arbOS11"].includes(hardfork);
// }

/**
 * Sets default reporter options
 */
export function getDefaultOptions(userConfig: Readonly<HardhatUserConfig>): GasReporterOptions {
  // let arbitrumHardfork: ArbitrumHardfork;
  let optimismHardfork: OptimismHardfork;

  const userOptions = userConfig.gasReporter;

  // NB: silently coercing to default if there's a misspelling or option not avail
  if (userOptions) {
    if (userOptions.L2 === "optimism" && !isOptimismHardfork(userOptions.optimismHardfork)){
      optimismHardfork = DEFAULT_OPTIMISM_HARDFORK;
    }

    // TODO: enable when arbitrum support added
    // if (userOptions.L2 === "arbitrum" && !isArbitrumHardfork(userOptions.arbitrumHardfork)) {
    //  arbitrumHardfork = DEFAULT_ARBITRUM_HARDFORK;
    // }
  }

  return {
    // arbitrumHardfork,
    currency: DEFAULT_CURRENCY,
    currencyDisplayPrecision: DEFAULT_CURRENCY_DISPLAY_PRECISION,
    darkMode: false,
    enabled: true,
    excludeContracts: [],
    excludeAutoGeneratedGetters: false,
    forceTerminalOutput: false,
    includeBytecodeInJSON: false,
    includeIntrinsicGas: true,
    L1: "ethereum",
    noColors: false,
    offline: false,
    optimismHardfork,
    outputJSON: false,
    outputJSONFile: DEFAULT_JSON_OUTPUT_FILE,
    reportFormat: TABLE_NAME_TERMINAL,
    reportPureAndViewMethods: false,
    rst: false,
    rstTitle: "",
    suppressTerminalOutput: false,
    showMethodSig: false,
    showUncalledMethods: false,
  };
}
