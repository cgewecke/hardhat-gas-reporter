import {
  DEFAULT_API_KEY_ARGS,
  DEFAULT_GAS_PRICE_API_ARGS,
  DEFAULT_GET_BLOCK_API_ARGS
} from "../constants"
import { GasReporterOptions } from "../types"

/**
 * Returns the CMC token symbol for a chain's native token. Uses chain configs below
 * and defers to user overrides
 * @param {GasReporterOptions} options
 * @returns
 */
export function getTokenForChain(options: GasReporterOptions): string {
  if (options.token) return options.token;

  // Gets caught and translated to warning
  if (!L1[options.L1!]) throw new Error();

  return L1[options.L1!].token;
}

/**
 * Gets Etherscan gasPrice api call url for chain. Attaches apikey if configured
 * @param {GasReporterOptions} options
 * @returns
 */
export function getGasPriceUrlForChain(options: GasReporterOptions): string {
  if (options.gasPriceApi) return options.gasPriceApi;

  const apiKey = (options.etherscan)
    ? `${DEFAULT_API_KEY_ARGS}${options.etherscan}`
    : "";

  if (options.L2) {
    if (!L2[options.L2]) throw new Error;
    return `${L2[options.L2!].baseUrl}${DEFAULT_GAS_PRICE_API_ARGS}${apiKey}`;
  }

  if (!L1[options.L1!]) throw new Error();

  return `${L1[options.L1!].baseUrl}${DEFAULT_GAS_PRICE_API_ARGS}${apiKey}`;
}

/**
 * Gets Etherscan getBlock api call url for chain. Attaches apikey if configured
 * @param {GasReporterOptions} options
 * @returns
 */
export function getBlockUrlForChain(options: GasReporterOptions): string {
  if (!options.L2) return "";
  if (options.getBlockApi) return options.getBlockApi;

  const apiKey = (options.etherscan)
    ? `${DEFAULT_API_KEY_ARGS}${options.etherscan}`
    : "";

  if (!L1[options.L1!]) throw new Error();

  return `${L1[options.L1!].baseUrl}${DEFAULT_GET_BLOCK_API_ARGS}${apiKey}`;
}

/**
 * L1 & L2 chain configurations for fetching gas price and block fee data from Etherscan as well
 * as currency prices from Coinmarketcap
 */
export const L1 = {
  ethereum: {
    baseUrl: "https://api.etherscan.io/api?module=proxy&",
    token: "ETH"
  },
  polygon: {
    baseUrl: "https://api.polygonscan.com/api?module=proxy&",
    token: "POL"
  },
  binance: {
    baseUrl: "https://api.bscscan.com/api?module=proxy&",
    token: "BNB"
  },
  fantom: {
    baseUrl: "https://api.ftmscan.com/api?module=proxy&",
    token: "FTM"
  },
  moonbeam: {
    baseUrl: "https://api-moonbeam.moonscan.io/api?module=proxy&",
    token: "GLMR"
  },
  moonriver: {
    baseUrl: "https://api-moonriver.moonscan.io//api?module=proxy&",
    token: "MOVR"
  },
  gnosis: {
    baseUrl: "https://api.gnosisscan.io/api?module=proxy&",
    token: "XDAI"
  },
  avalanche: {
    baseUrl: "https://api.snowtrace.io/api?module=proxy&",
    token: "AVAX"
  }
}

export const L2 = {
  optimism: {
    baseUrl: "https://api-optimistic.etherscan.io/api?module=proxy&",
    token: "ETH"
  },
  arbitrum: {
    baseUrl: "https://api.arbiscan.io/api?module=proxy&",
    token: "ETH"
  }
}
