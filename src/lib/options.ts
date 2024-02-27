import { HardhatUserConfig } from "hardhat/types";
import {
  DEFAULT_ARBITRUM_HARDFORK,
  DEFAULT_GET_BLOCK_API_URL,
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_DISPLAY_PRECISION,
  DEFAULT_GAS_PRICE_API_URL,
  DEFAULT_JSON_OUTPUT_FILE,
  DEFAULT_OPTIMISM_HARDFORK,
  TABLE_NAME_TERMINAL
} from "../constants";

import { ArbitrumHardfork, GasReporterOptions, OptimismHardfork } from "../types";

/**
 * Validates Optimism hardfork option
 * @param hardfork
 * @returns {boolean}
 */
function isOptimismHardfork(hardfork: string | undefined) {
  if (hardfork === undefined) return false;

  return ["bedrock, ecotone"].includes(hardfork);
}

/**
 * Validates Arbitrum hardfork option
 * @param hardfork
 * @returns
 */
function isArbitrumHardfork(hardfork: string | undefined) {
  if (hardfork === undefined) return false;

  return ["arbOS11"].includes(hardfork);
}

/**
 * Sets default reporter options
 */
export function getDefaultOptions(userConfig: Readonly<HardhatUserConfig>): GasReporterOptions {
  let arbitrumHardfork: ArbitrumHardfork;
  let optimismHardfork: OptimismHardfork;

  const userOptions = userConfig.gasReporter;

  // NB: silently coercing to default if there's a misspelling or option not avail
  if (userOptions) {
    if (userOptions.L2 === "optimism" && !isOptimismHardfork(userOptions.optimismHardfork)){
      optimismHardfork = DEFAULT_OPTIMISM_HARDFORK;
    }

    if (userOptions.L2 === "arbitrum" && !isArbitrumHardfork(userOptions.arbitrumHardfork)) {
      arbitrumHardfork = DEFAULT_ARBITRUM_HARDFORK;
    }
  }

  return {
    arbitrumHardfork,
    getBlockApi: DEFAULT_GET_BLOCK_API_URL,
    currency: DEFAULT_CURRENCY,
    currencyDisplayPrecision: DEFAULT_CURRENCY_DISPLAY_PRECISION,
    darkMode: false,
    enabled: true,
    excludeContracts: [],
    forceTerminalOutput: false,
    gasPriceApi: DEFAULT_GAS_PRICE_API_URL,
    noColors: false,
    showUncalledMethods: false,
    offline: false,
    optimismHardfork,
    outputJSON: false,
    outputJSONFile: DEFAULT_JSON_OUTPUT_FILE,
    proxyResolver: null,
    reportFormat: TABLE_NAME_TERMINAL,
    rst: false,
    rstTitle: "",
    showMethodSig: false,
    token: "ETH"
  };
}
