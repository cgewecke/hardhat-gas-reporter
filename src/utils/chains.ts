import {
  DEFAULT_API_KEY_ARGS,
  DEFAULT_GAS_PRICE_API_ARGS,
  DEFAULT_GET_BLOCK_API_ARGS,
  DEFAULT_BLOB_BASE_FEE_API_ARGS,
  DEFAULT_BASE_FEE_PER_BYTE_API_ARGS,
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
 * Gets Etherscan gasPrice api call url for chain. Attaches L1 or L2 apikey if configured
 * @param {GasReporterOptions} options
 * @returns
 */
export function getGasPriceUrlForChain(options: GasReporterOptions): string {
  if (options.gasPriceApi) return options.gasPriceApi;

  const apiKey = (options.etherscan) ? `${DEFAULT_API_KEY_ARGS}${options.etherscan}` : "";

  if (options.L2) {
    if (!L2[options.L2]) throw new Error;
    return `${L2[options.L2!].baseUrl}${DEFAULT_GAS_PRICE_API_ARGS}${apiKey}`;
  }

  if (!L1[options.L1!]) throw new Error();
  return `${L1[options.L1!].baseUrl}${DEFAULT_GAS_PRICE_API_ARGS}${apiKey}`;
}

/**
 * Gets Etherscan getBlock api call url for chain. Attaches L1 apikey if configured
 * (THIS IS ALWAYS for L1 data-related fees in the context of L2 execution)
 * @param {GasReporterOptions} options
 * @returns
 */
export function getBlockUrlForChain(options: GasReporterOptions): string {
  if (!options.L2) return "";
  if (options.getBlockApi) return options.getBlockApi;

  const apiKey = (options.etherscan) ? `${DEFAULT_API_KEY_ARGS}${options.etherscan}` : "";

  if (!L1[options.L1!]) throw new Error();

  return `${L1[options.L1!].baseUrl}${DEFAULT_GET_BLOCK_API_ARGS}${apiKey}`;
}

/**
 * Gets Etherscan eth_call api url to read OP Stack GasPriceOracle for blobBaseFee.
 * Attaches apikey if configured. (This fee fetched from L2 contract b/c its the only available place at
 * time of PR - eth_blobBaseFee hasn't been implemented in geth yet)
 * @param {GasReporterOptions} options
 * @returns
 */
export function getBlobBaseFeeUrlForChain(options: GasReporterOptions): string {
  if (!options.L2) return "";
  if (options.blobBaseFeeApi) return options.blobBaseFeeApi;

  const apiKey = (options.etherscan) ? `${DEFAULT_API_KEY_ARGS}${options.etherscan}` : "";

  return `${L2[options.L2!].baseUrl}${DEFAULT_BLOB_BASE_FEE_API_ARGS}${L2[options.L2!].gasPriceOracle}${apiKey}`;
}

/**
 * Gets Etherscan eth_call api url to read OP Stack GasPriceOracle for blobBaseFee.
 * Attaches apikey if configured. (This fee fetched from L2 contract b/c its the only available place at
 * time of PR - eth_blobBaseFee hasn't been implemented in geth yet)
 * @param {GasReporterOptions} options
 * @returns
 */
export function getBaseFeePerByteUrlForChain(options: GasReporterOptions): string {
  if (options.L2 !== "arbitrum") return "";

  const apiKey = (options.etherscan) ? `${DEFAULT_API_KEY_ARGS}${options.etherscan}` : "";

  return `${L2[options.L2!].baseUrl}${DEFAULT_BASE_FEE_PER_BYTE_API_ARGS}${apiKey}`;
}

/**
 * L1 & L2 chain configurations for fetching gas price and block fee data from Etherscan as well
 * as currency prices from Coinmarketcap
 */
export const L1 = {
  ethereum: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=1&",
    token: "ETH"
  },
  polygon: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=137&",
    token: "POL"
  },
  binance: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=56&",
    token: "BNB"
  },
  fantom: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=250&",
    token: "FTM"
  },
  moonbeam: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=1284&",
    token: "GLMR"
  },
  moonriver: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=1285&",
    token: "MOVR"
  },
  gnosis: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=100&",
    token: "XDAI"
  },
  avalanche: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=43114&",
    token: "AVAX"
  }
}

export const L2 = {
  optimism: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=10&",
    gasPriceOracle: "0x420000000000000000000000000000000000000F",
    token: "ETH"
  },
  base: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=8453&",
    gasPriceOracle: "0x420000000000000000000000000000000000000F",
    token: "ETH"
  },
  arbitrum: {
    baseUrl: "https://api.etherscan.io/v2/api?module=proxy&chainid=42161&",
    gasPriceOracle: "",
    token: "ETH"
  }
}
