import { DEFAULT_CURRENCY, DEFAULT_GAS_PRICE_API_URL } from "../constants";

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
    proxyResolver: null,
    rst: false,
    rstTitle: "",
    showMethodSig: false,
    token: "ETH"
  };
}
