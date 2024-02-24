import axios from "axios";
import {
  DEFAULT_COINMARKET_BASE_URL,
  OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD,
  OPTIMISM_BEDROCK_FIXED_OVERHEAD,
  OPTIMISM_ECOTONE_BASE_FEE_SCALAR,
  OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR
} from "../constants";

import { GasReporterOptions } from "../types";

/**
==========================
OPTIMISM BEDROCK
==========================
Prior to the Ecotone upgrade, the L1 Data Fee is calculated based on the following parameters:

The signed transaction serialized according to the standard Ethereum transaction RLP encoding.
The current Ethereum base fee (trustlessly relayed from Ethereum).

+ A fixed overhead cost for publishing a transaction (currently set to 188 gas).
+ A dynamic overhead cost which scales with the size of the transaction (currently set to 0.684).

The L1 Data Fee calculation first begins with counting the number of zero bytes and non-zero bytes
in the transaction data. Each zero byte costs 4 gas and each non-zero byte costs 16 gas.
This is the same way that Ethereum calculates the gas cost of transaction data.

tx_data_gas = count_zero_bytes(tx_data) * 4 + count_non_zero_bytes(tx_data) * 16

After calculating the gas cost of the transaction data, the fixed and dynamic overhead values are
applied.

```
tx_total_gas = (tx_data_gas + fixed_overhead) * dynamic_overhead
```

Finally, the total L1 Data Fee is calculated by multiplying the total gas cost by the current
Ethereum base fee.

```
l1_data_fee = tx_total_gas * ethereum_base_fee
```
Source: https://docs.optimism.io/stack/transactions/fees#formula

*/

/**
 * Gets the scaled calldata gas usage for a tx (an input into the function below)
 * @param txInput `input` field of JSONRPC getTransaction response
 * @returns
 */
export function getOptimismBedrockL1Gas(txInput: string): number {
  const txDataGas = getTxCalldataGas(txInput);

  const totalTxDataGas = Math.floor(
    (txDataGas + OPTIMISM_BEDROCK_FIXED_OVERHEAD) * OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD
  );

  return totalTxDataGas;
}

/**
 * Gets the native token denominated cost of registering tx calldata to L1
 * @param txDataGas       amount obtained from `getOptimismBedrockL1Gas`
 * @param baseFee              amount obtained from previous block
 * @returns
 */
export function getOptimismBedrockL1Cost(txDataGas: number, baseFee: number): number {
  return txDataGas * baseFee;
}

/*
* ==========================
* OPTIMISM ECOTONE
* ==========================
*
* The Ecotone L1 Data Fee calculation begins with counting the number of zero bytes and non-zero bytes
* in the transaction data. Each zero byte costs 4 gas and each non-zero byte costs 16 gas. This value,
* when divided by 16, can be thought of as a rough estimate of the size of the transaction data after
* compression.
*
* ```
* tx_compressed_size = [(count_zero_bytes(tx_data)*4 + count_non_zero_bytes(tx_data)*16)] / 16
* ``
* Next, the two scalars are applied to the base fee and blob base fee parameters to compute a weighted
* gas price multiplier.
*
* ```
* weighted_gas_price = 16*base_fee_scalar*base_fee + blob_base_fee_scalar*blob_base_fee
* ```

* The l1 data fee is then:
*
* ```
* l1_data_fee = tx_compressed_size * weighted_gas_price
* ```
*/

/**
 * Gets compressed transaction calldata gas usage (an input into the cost function below)
 * @param txInput `input` field of JSONRPC getTransaction response
 * @returns
 */
export function getOptimismEcotoneL1Gas(txInput: string) {
  return Math.floor(getTxCalldataGas(txInput) / 16);
}

/**
 * Gets the native token denominated cost of registering tx calldata to L1
 * @param txCompressed
 * @param baseFee
 * @param blobBaseFee
 * @returns
 */
export function getOptimismEcotoneL1Cost(
  txCompressed: number,
  baseFee: number,
  blobBaseFee: number
): number {
  const weightedBaseFee = 16 * OPTIMISM_ECOTONE_BASE_FEE_SCALAR * baseFee;
  const weightedBlobBaseFee = OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR * blobBaseFee;
  return txCompressed * (weightedBaseFee + weightedBlobBaseFee);
}

// ==========================
// ARBITRUM OS11
// ==========================

// STUB
// eslint-disable-next-line
export function getArbitrum_OS11_L1Gas(txInput: string) {
  return 0;
}

// eslint-disable-next-line
export function getArbitrum_OS20_L1Gas(txInput: string) {
  return 0;
}

// ==========================
// ARBITRUM OS20
// ==========================

// STUB
// eslint-disable-next-line
export function getArbitrum_OS11_L1Cost(gas: number) {
  return 0;
}

// STUB
// eslint-disable-next-line
export function getArbitrum_OS20_L1Cost(gas: number) {
  return 0;
}

/**
 * Computes the amount of L1 gas used for a transaction. The overhead represents the per batch
 * gas overhead of posting both transaction and state roots to L1 given larger batch sizes.
 *
 *  4   gas for 0 byte
 * 16   gas for non zero byte
 *
 * Account for the transaction being unsigned. Padding is added to account for lack of signature
 * on transaction
 *
 *         1   byte for RLP V prefix
 *         1   byte for V
 *         1   byte for RLP R prefix
 *        32   bytes for R
 *         1   byte for RLP S prefix
 *        32   bytes for S
 * ----------
 * Total: 68   bytes of padding
 *
 * SOURCE: optimism/packages/contracts/contracts/L2/predeploys/OVM_GasPriceOracle.sol
 */
export function getTxCalldataGas(txInput: string): number {
  let total = 0;

  // String hex-prefixed, 1 byte = 2 hex chars
  for (let i = 2; i < txInput.length; i++) {
    if (i % 2 === 0) {
      total = (txInput[i] === "0" && txInput[i + 1] === "0")
        ? total + 4
        : total + 16;
    }
  }
  // Assume VRS components are non-zero
  return total + (68 * 16);
}

/**
 * Gets calldata gas amount for network by hardfork
 * @param options      GasReporterOptions
 * @param txInput     `input` field of JSONRPC transaction
 * @returns
 */
export function getCalldataGasForNetwork(
  options: GasReporterOptions,
  txInput: string
) : number {
  if (options.L2 === "optimism") {
    switch (options.optimismHardfork){
      case "bedrock": return getOptimismBedrockL1Gas(txInput);
      case "ecotone": return getOptimismEcotoneL1Gas(txInput);
      default: return 0; /** This shouldn't happen */
    }
  }

  if (options.L2 === "arbitrum") {
    switch (options.arbitrumHardfork){
      case "arbOS11": return getArbitrum_OS11_L1Gas(txInput);
      case "arbOS20": return getArbitrum_OS20_L1Gas(txInput);
      default: return 0; /** This shouldn't happen */
    }
  }

  // If not configured for L2
  return 0;
}

/**
 * Gets calldata gas X gas price for network by hardfork
 * @param options        GasReporterOptions
 * @param gas            Scaled gas value collected
 * @param baseFee        Network fee from block
 * @param blobBaseFee    Network fee from block
 * @returns
 */
export function getCalldataCostForNetwork(
  options: GasReporterOptions,
  gas: number,
) : number {
  if (options.L2 === "optimism") {
    switch (options.optimismHardfork){
      case "bedrock": return getOptimismBedrockL1Cost(gas, options.baseFee!);
      case "ecotone": return getOptimismEcotoneL1Cost(gas, options.baseFee!, options.blobBaseFee!);
      default: return 0; /** This shouldn't happen */
    }
  }

  if (options.L2 === "arbitrum") {
    switch (options.arbitrumHardfork){
      case "arbOS11": return getArbitrum_OS11_L1Cost(gas);
      case "arbOS20": return getArbitrum_OS20_L1Cost(gas);
      default: return 0; /** This shouldn't happen */
    }
  }

  // If not configured for L2
  return 0;
}

/**
 * Expresses gas usage as a nation-state currency price
 * @param  {Number} gas      gas used
 * @param  {Number} tokenPrice e.g chf/eth
 * @param  {Number} gasPrice in wei e.g 5000000000 (5 gwei)
 * @return {Number}          cost of gas used (0.00)
 */
export function gasToCost(
  executionGas: number,
  calldataGas: number,
  options: GasReporterOptions
): string {
  let calldataCost: number = 0;

  if (options.L2) {
    const cost = getCalldataCostForNetwork(options, calldataGas);
    calldataCost =  (cost / 1e9) * parseFloat(options.tokenPrice!);
  }

  const executionCost = (options.gasPrice! / 1e9) * executionGas * parseFloat(options.tokenPrice!);
  return (executionCost + calldataCost).toFixed(2);
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
 * the options from coinmarketcap (defaults to usd). Sets options.tokenPrice, options.gasPrice
 * unless these are already set as constants in the reporter options
 * @param  {GasReporterOptions} options
 */
export async function setGasAndPriceRates(options: GasReporterOptions): Promise<void> {
  if ((options.tokenPrice && options.gasPrice) || !options.coinmarketcap) return;

  let block;
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
      /* ignore */
    }
  }

  // Gas price data: etherscan (or `gasPriceAPI`)
  if (!options.gasPrice) {
    try {
      const response = await axiosInstance.get(gasPriceApi!);
      const gasPrice = parseInt(response.data.result, 16) / Math.pow(10, 9);
      options.gasPrice = (gasPrice >= 1 ) ? Math.round(gasPrice) : gasPrice;;
    } catch (error) {
      options.gasPrice = 0;
    }
  }

  if (options.L2 && !options.baseFee) {
    try {
      block = await axiosInstance.get(getBlockApi!);
      options.baseFee = Math.round(
        parseInt(block.data.result.baseFeePerGas, 16) / Math.pow(10, 9)
      );
    } catch (error) {
      options.baseFee = 0;
    }
  }

  if (options.L2 && !options.blobBaseFee) {
    options.blobBaseFee = 0;

    // TODO: DENCUN
    /* if (block === undefined) {
      try {
        block = await axiosInstance.get(getBlockApi!);
      } catch (error) {
        options.blobBaseFee = 0;
        return;
      }
    }
    options.baseFee = Math.round(
      parseInt(block.data.result.blobBaseFeePerGas, 16) / Math.pow(10, 9)
    );*/
  }
}
