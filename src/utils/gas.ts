import axios from "axios";
import { DEFAULT_COINMARKET_BASE_URL } from "../constants";
import { GasReporterOptions } from "../types";

/**
 * Expresses gas usage as a nation-state currency price
 * @param  {Number} gas      gas used
 * @param  {Number} ethPrice e.g chf/eth
 * @param  {Number} gasPrice in wei e.g 5000000000 (5 gwei)
 * @return {Number}          cost of gas used (0.00)
 */
export function gasToCost(gas: number, ethPrice: number, gasPrice: number): string {
  return ((gasPrice / 1e9) * gas * ethPrice).toFixed(2);
}

/**
 * Expresses gas usage as a % of the block gasLimit. Source: NeuFund (see issues)
 * @param  {Number} gasUsed    gas value
 * @param  {Number} blockLimit gas limit of a block
 * @return {Number}            percent (0.0)
 */
export function gasToPercentOfLimit(gasUsed: number, blockLimit: number): number {
  return Math.round((1000 * gasUsed) / blockLimit) / 10;
}

/**
 * Converts hex gas to decimal
 * @param  {bigint} val hex gas returned by RPC
 * @return {Number}     decimal gas
 */
export function hexGasToDecimal(val: string): number {
  return parseInt(val, 16);
}

/**
 * Fetches gasPrices from etherscan and current market value of eth in currency specified by
 * the options from coinmarketcap (defaults to usd). Sets options.ethPrice, options.gasPrice
 * unless these are already set as constants in the reporter options
 * @param  {GasReporterOptions} options
 */
export async function setGasAndPriceRates(options: GasReporterOptions): Promise<void> {
  if ((options.ethPrice && options.gasPrice) || !options.coinmarketcap) return;

  const token = options.token!.toUpperCase();
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
  if (!options.ethPrice) {
    try {
      const response = await axiosInstance.get(currencyPath);
      options.ethPrice = response.data.data[token].quote[
        currencyKey
      ].price.toFixed(2);
    } catch (error) {
      /* ignore */
    }
  }

  // Gas price data: etherscan (or `gasPriceAPI`)
  if (!options.gasPrice) {
    try {
      const response = await axiosInstance.get(gasPriceApi!);
      console.log(`got gas price: ${  response.data.result}`);
      options.gasPrice = Math.round(
        parseInt(response.data.result, 16) / Math.pow(10, 9)
      );
    } catch (error) {
      options.gasPrice = options.gasPrice;
    }
  }
}
