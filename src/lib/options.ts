import { DEFAULT_CURRENCY, DEFAULT_GAS_PRICE,DEFAULT_GAS_PRICE_API_URL } from "../constants";

import { GasReporterOptions } from "../types";

/**
 * Sets default reporter options
 */
export function getDefaultOptions(): GasReporterOptions {
  return {
    blockLimit: undefined,     // gets set immediately prior to output formatting
    coinmarketcap: undefined,
    currency: DEFAULT_CURRENCY,
    enabled: true,
    ethPrice: undefined,
    excludeContracts: [],
    gasPrice: DEFAULT_GAS_PRICE,
    gasPriceApi: DEFAULT_GAS_PRICE_API_URL,
    noColors: false,
    onlyCalledMethods: true,
    outputFile: undefined,
    proxyResolver: null,
    rst: false,
    rstTitle: "",
    showMethodSig: false,
    token: "ETH"
  };
}
