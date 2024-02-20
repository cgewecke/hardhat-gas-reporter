import { DEFAULT_CURRENCY, DEFAULT_GAS_PRICE_API_URL, DEFAULT_JSON_OUTPUT_FILE } from "../constants";

import { GasReporterOptions } from "../types";

/**
 * Sets default reporter options
 */
export function getDefaultOptions(): GasReporterOptions {
  return {
    currency: DEFAULT_CURRENCY,
    enabled: true,
    excludeContracts: [],
    gasPriceApi: DEFAULT_GAS_PRICE_API_URL,
    noColors: false,
    showUncalledMethods: false,
    outputJSON: false,
    outputJSONFile: DEFAULT_JSON_OUTPUT_FILE,
    proxyResolver: null,
    rst: false,
    rstTitle: "",
    showMethodSig: false,
    token: "ETH"
  };
}
