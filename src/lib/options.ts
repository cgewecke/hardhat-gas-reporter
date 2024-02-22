import {
  DEFAULT_CURRENCY,
  DEFAULT_GAS_PRICE_API_URL,
  DEFAULT_JSON_OUTPUT_FILE,
  TABLE_NAME_TERMINAL
} from "../constants";

import { GasReporterOptions } from "../types";

/**
 * Sets default reporter options
 */
export function getDefaultOptions(): GasReporterOptions {
  return {
    currency: DEFAULT_CURRENCY,
    darkMode: false,
    enabled: true,
    excludeContracts: [],
    gasPriceApi: DEFAULT_GAS_PRICE_API_URL,
    noColors: false,
    showUncalledMethods: false,
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
