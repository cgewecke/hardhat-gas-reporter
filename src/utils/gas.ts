import { serializeTransaction, Hex } from 'viem';
import {
  EVM_BASE_TX_COST,
  OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD,
  OPTIMISM_BEDROCK_FIXED_OVERHEAD,
  OPTIMISM_ECOTONE_BASE_FEE_SCALAR,
  OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR
} from "../constants";

import { GasReporterOptions, JsonRpcTx } from "../types";

/**
==========================
OPTIMISM BEDROCK
==========================
Given:

+ A fixed overhead cost for publishing a transaction (currently set to 188 gas).
+ A dynamic overhead cost which scales with the size of the transaction (currently set to 0.684).

Count the number of zero bytes and non-zero bytes in the transaction data. Each zero byte
costs 4 gas and each non-zero byte costs 16 gas.
```
tx_data_gas = count_zero_bytes(tx_data) * 4 + count_non_zero_bytes(tx_data) * 16
tx_total_gas = (tx_data_gas + fixed_overhead) * dynamic_overhead
l1_data_fee = tx_total_gas * ethereum_base_fee
```
Source: https://docs.optimism.io/stack/transactions/fees#formula
*/

/**
 * Gets calldata gas plus overhead for a tx (an input into the function below)
 * @param tx        JSONRPC formatted getTransaction response
 * @returns
 */
export function getOptimismBedrockL1Gas(tx: JsonRpcTx): number {
  // TODO: Am getting a small underestimate here compared to Etherscan, plus
  // its weird to split up the overhead calc into different functions? (Just doing this
  // so the numbers look right compared to scan but seems wrong)
  const txDataGas = getSerializedTxDataGas(tx);
  return txDataGas + OPTIMISM_BEDROCK_FIXED_OVERHEAD;
}

/**
 * Gets the native token denominated cost of registering tx calldata to L1
 * @param txDataGas            amount obtained from `getOptimismBedrockL1Gas`
 * @param baseFee              amount obtained from previous block
 * @returns
 */
export function getOptimismBedrockL1Cost(txDataGas: number, baseFee: number): number {
  return Math.floor(OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD * txDataGas) * baseFee;
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
 * @param tx    JSONRPC formatted getTransaction response
 * @returns
 */
export function getOptimismEcotoneL1Gas(tx: JsonRpcTx) {
  return Math.floor(getSerializedTxDataGas(tx) / 16);
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
export function getArbitrum_OS11_L1Gas(tx: JsonRpcTx) {
  return 0;
}

// eslint-disable-next-line
export function getArbitrum_OS20_L1Gas(tx: JsonRpcTx) {
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
 * on transaction.  (Assume VRS components are non-zero)
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
export function getSerializedTxDataGas(tx: JsonRpcTx): number {
  const type = normalizeTxType(tx.type);

  const maxFeePerGas = (tx.maxFeePerGas)
        ? hexToBigInt(tx.maxFeePerGas)
        : BigInt(0);

  const maxPriorityFeePerGas = (tx.maxPriorityFeePerGas)
      ? hexToBigInt(tx.maxPriorityFeePerGas)
      : BigInt(0);

  const serializedTx = serializeTransaction ({
    to: tx.to as Hex,
    maxFeePerGas,
    maxPriorityFeePerGas,
    data: tx.data as Hex ? tx.data! as Hex : tx.input! as Hex,
    value: hexToBigInt(tx.value),
    chainId: parseInt(tx.chainId!),
    type,
    accessList: tx.accessList,
    nonce: parseInt(tx.nonce)
  })

  const total = getCalldataBytesGas(serializedTx);
  return total + (68 * 16);
}

/**
 * Computes the intrinsic gas overhead for the data component of a transaction
 * @param data
 * @returns
 */
export function getCalldataBytesGas(data: string): number {
  let total = 0;
  // String hex-prefixed, 1 byte = 2 hex chars
  for (let i = 2; i < data.length; i++) {
    if (i % 2 === 0) {
      total = (data[i] === "0" && data[i + 1] === "0")
        ? total + 4
        : total + 16;
    }
  }
  return total;
}

/**
 * Returns estimate of the intrinsic gas used for executing a tx on L1 EVM;
 * @param tx
 * @returns
 */
export function getIntrinsicGas(data: string): number {
  const gas = getCalldataBytesGas(data);
  return gas + EVM_BASE_TX_COST;
}

/**
 * Returns gas cost minus the intrinsic gas call overhead for a transaction
 * @param data
 * @param gas
 * @returns
 */
export function getGasSubIntrinsic(data: string, gas: number) {
  const intrinsic = getIntrinsicGas(data);
  return gas - intrinsic;
}

/**
 * Gets calldata gas amount for network by hardfork
 * @param options      GasReporterOptions
 * @param tx           JSONRPC formatted transaction
 * @returns
 */
export function getCalldataGasForNetwork(
  options: GasReporterOptions,
  tx: JsonRpcTx
) : number {
  if (options.L2 === "optimism") {
    switch (options.optimismHardfork){
      case "bedrock": return getOptimismBedrockL1Gas(tx);
      case "ecotone": return getOptimismEcotoneL1Gas(tx);
      default: return 0; /** This shouldn't happen */
    }
  }

  if (options.L2 === "arbitrum") {
    switch (options.arbitrumHardfork){
      case "arbOS11": return getArbitrum_OS11_L1Gas(tx);
      case "arbOS20": return getArbitrum_OS20_L1Gas(tx);
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
 * @param  {Number} executionGas      execution gas used
 * @param  {Number} calldataGas       data gas used
 * @param  {GasReporterOptions}       options
 * @return {string}                   cost of gas used "0.00"
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
  return (executionCost + calldataCost).toFixed(options.currencyDisplayPrecision);
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
 * Converts hex to decimal
 * @param  {string}     hex JSONRPC val
 * @return {Number}     decimal
 */
export function hexToDecimal(val: string): number {
  return parseInt(val.toString(), 16);
}

/**
 * Converts hex to bigint
 * @param  {string}     hex JSONRPC val
 * @return {BigInt}     bigint
 */
export function hexToBigInt(val: string): bigint {
  return BigInt(val);
}

export function hexWeiToIntGwei(val: string): number {
  return hexToDecimal(val) / Math.pow(10, 9);
}

export function normalizeTxType(_type: string) {
  switch(hexToDecimal(_type)) {
    case 0: return 'legacy';
    case 1: return 'eip2930;'
    case 2: return 'eip1559';

    // This will error within viem.serializeTransaction
    default: return _type;
  }
}

