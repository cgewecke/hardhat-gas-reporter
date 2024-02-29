import axios from "axios";
import { DEFAULT_COINMARKET_BASE_URL } from "../constants";
import { GasReporterOptions } from "../types";
import {
  warnCMCRemoteCallFailed,
  warnGasPriceRemoteCallFailed,
  warnBaseFeeRemoteCallFailed,
} from "./ui";

import { hexWeiToIntGwei } from "./gas";

/**
 * Fetches gas, base, & blob fee rates from etherscan as well as current market value of
 * network token in nation state currency specified by the options from coinmarketcap
 * (defaults to usd). Sets
 *
 * + options.tokenPrice
 * + options.gasPrice
 * + options.baseFee
 * + options.blobBaseFee
 *
 * ... unless these are already set as constants in the reporter options
 *
 * Returns a list of warnings generated if remote calls fail
 * @param  {GasReporterOptions} options
 */
export async function setGasAndPriceRates(options: GasReporterOptions): Promise<string[]> {
  if (
    (options.offline) ||
    !options.coinmarketcap ||
    (!options.L2 && options.tokenPrice && options.gasPrice) ||
    (options.L2 && options.tokenPrice && options.gasPrice && options.baseFee && options.blobBaseFee)
  ) return [];

  let block;
  const warnings: string[] = [];

  const token = options.token!.toUpperCase();
  const getBlockApi = options.getBlockApi;
  const gasPriceApi = options.gasPriceApi;

  const axiosInstance = axios.create({
    baseURL: DEFAULT_COINMARKET_BASE_URL
  });

  const requestArgs = `latest?symbol=${token}&CMC_PRO_API_KEY=${
    options.coinmarketcap
  }&convert=`;

  const currencyKey = options.currency!.toUpperCase();
  const currencyPath = `${requestArgs}${currencyKey}`;

  // Currency market data: coinmarketcap
  if (!options.tokenPrice) {
    try {
      const response = await axiosInstance.get(currencyPath);
      options.tokenPrice = response.data.data[token].quote[
        currencyKey
      ].price.toFixed(2);
    } catch (error) {
      warnings.push(warnCMCRemoteCallFailed(error, DEFAULT_COINMARKET_BASE_URL + currencyPath));
    }
  }

  // Gas price data: etherscan (or `gasPriceAPI`)
  if (!options.gasPrice) {
    try {
      const response = await axiosInstance.get(gasPriceApi!);
      checkForEtherscanRateLimitError(response.data.result);
      const gasPrice = hexWeiToIntGwei(response.data.result);
      options.gasPrice = (gasPrice >= 1 ) ? Math.round(gasPrice) : gasPrice;;
    } catch (error) {
      options.gasPrice = 0;
      warnings.push(warnGasPriceRemoteCallFailed(error, gasPriceApi!));
    }
  }

  // baseFee data: etherscan (or `getBlockAPI`)
  if (options.L2 && !options.baseFee) {
    try {
      block = await axiosInstance.get(getBlockApi!);
      checkForEtherscanRateLimitError(block.data.result);
      options.baseFee = Math.round(hexWeiToIntGwei(block.data.result.baseFeePerGas))
    } catch (error) {
      options.baseFee = 0;
      warnings.push(warnBaseFeeRemoteCallFailed(error, getBlockApi!));
    }
  }

  // blobBaseFee data: etherscan (or `getBlockAPI`)
  if (options.L2 && !options.blobBaseFee) {
    options.blobBaseFee = 0;

    // TODO: DENCUN
    /* if (block === undefined) {
      try {
        block = await axiosInstance.get(getBlockApi!);
        checkForEtherscanRateLimitError(block.data.result);
      } catch (error) {
        options.blobBaseFee = 0;
        warnings.push(warnBlobBaseFeeRemoteCallFailed(error, getBlockApi));
        return;
      }
    }
    options.baseFee = Math.round(
      parseInt(block.data.result.blobBaseFeePerGas, 16) / Math.pow(10, 9)
    );*/
  }

  return warnings;
}

function checkForEtherscanRateLimitError(res: string) {
  if (typeof res === "string" && res.includes("rate limit reached")){
    throw new Error(res);
  }
}
