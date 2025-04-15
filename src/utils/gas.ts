import { serializeTransaction, getTransactionType, Hex, TransactionSerializableGeneric, TransactionSerializableLegacy } from 'viem';
import { compress } from 'brotli-wasm';
import {
  EVM_BASE_TX_COST,
  OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD,
  OPTIMISM_BEDROCK_FIXED_OVERHEAD,
  RANDOM_R_COMPONENT,
  RANDOM_S_COMPONENT
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
  const txDataGas = getOPStackDataGas(tx);
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
 *
 * The l1 data fee is then:
 *
 * ```
 * l1_data_fee = tx_compressed_size * weighted_gas_price
 * ```
 *
 *
 * Source: https://github.com/ethereum-optimism/optimism/blob/e57787ea7d0b9782cea5f32bcb92d0fdeb7bd870/ +
 *         packages/contracts-bedrock/src/L2/GasPriceOracle.sol#L88-L92
 *
 * DECIMALS = 6
 *
 * function _getL1FeeEcotone(bytes memory _data) internal view returns (uint256) {
 *       uint256 l1GasUsed = _getCalldataGas(_data);
 *       uint256 scaledBaseFee = baseFeeScalar() * 16 * l1BaseFee();
 *       uint256 scaledBlobBaseFee = blobBaseFeeScalar() * blobBaseFee();
 *       uint256 fee = l1GasUsed * (scaledBaseFee + scaledBlobBaseFee);
 *       return fee / (16 * 10 ** DECIMALS);
 *   }
 */

/**
 * Gets the native token denominated cost of registering tx calldata to L1
 * @param txSerialized
 * @param txCompressed
 * @param baseFee
 * @param blobBaseFee
 * @param opStackBaseFeeScalar
 * @param opStackBlobBaseFeeScalar
 * @returns
 */
export function getOPStackEcotoneL1Cost(
  txSerialized: number,
  baseFee: number,
  blobBaseFee: number,
  opStackBaseFeeScalar: number,
  opStackBlobBaseFeeScalar: number
): number {
  const weightedBaseFee = 16 * opStackBaseFeeScalar * baseFee;
  const weightedBlobBaseFee = opStackBlobBaseFeeScalar * blobBaseFee;
  return (txSerialized * (weightedBaseFee + weightedBlobBaseFee)) / 16000000;
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
export function getOPStackDataGas(tx: JsonRpcTx): number {
  const serializedTx = getSerializedTx (tx);
  const total = getCalldataBytesGas(serializedTx);
  return total + (68 * 16);
}

// ==========================
// ARBITRUM OS20
// ==========================
export function getArbitrumL1Bytes(tx: JsonRpcTx) {
  const serializedTx = getSerializedTx(tx);
  const compressedTx = compress(Buffer.from(serializedTx), {quality: 2});
  const compressedLength = Buffer.from(compressedTx).toString('utf8').length;
  return compressedLength + 140;
}

export function getArbitrumL1Cost(bytes: number, gasPrice: number, baseFeePerByte: number) {
  // Debit 10% estimate buffer
  const adjustedBaseFeePerByte = Math.round(baseFeePerByte - (baseFeePerByte/10))
  const l1Gas = adjustedBaseFeePerByte * 1e9 * bytes;
  const l1Cost = l1Gas / (gasPrice * 1e9)
  return l1Cost;
}

/**
 * Serializes transaction
 * @param tx
 * @returns
 */
export function getSerializedTx(_tx: JsonRpcTx, emulateSignatureComponents = false): string {
  let signature;

  const tx = toTransactionSerializable(_tx);
  const type = getTransactionType(tx) as "eip2930" | "eip4844" | "eip7702" | "eip1559" | "legacy" | undefined;

  // For arbitrum - part of their estimation flow at nitro
  // TEMORARILY DISABLED DUE TO CRASH REPORTED IN ISSUE #258
  if (emulateSignatureComponents) {
    signature = {
      v: BigInt(0),
      r: RANDOM_R_COMPONENT as `0x${string}`,
      s: RANDOM_S_COMPONENT as `0x${string}`
    }
  }

  return serializeTransaction ({
    to: tx.to,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
    data: tx.data,
    value: tx.value,
    chainId: tx.chainId,
    type,
    nonce: tx.nonce,
  } as TransactionSerializableLegacy, signature)
}

export function toTransactionSerializable(_tx: JsonRpcTx) : TransactionSerializableGeneric {

  return {
    data: _tx.data as Hex ? _tx.data! as Hex : _tx.input! as Hex,
    to: _tx.to as Hex,
    value: hexToBigInt(_tx.value),
    nonce: parseInt(_tx.nonce),
    gas: (_tx.gas) ? hexToBigInt(_tx.gas) : BigInt(0),
    maxFeePerGas: (_tx.maxFeePerGas) ? hexToBigInt(_tx.maxFeePerGas) : BigInt(0),
    maxPriorityFeePerGas: (_tx.maxPriorityFeePerGas) ? hexToBigInt(_tx.maxPriorityFeePerGas) : BigInt(0),
    chainId: (_tx.chainId === undefined) ? 1337 : parseInt(_tx.chainId),
  }
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
  if (options.L2 === "optimism" || options.L2 === "base") {
    switch (options.optimismHardfork){
      case "bedrock": return getOptimismBedrockL1Gas(tx);
      case "ecotone": return getOPStackDataGas(tx);
      default: return 0; /** This shouldn't happen */
    }
  }

  if (options.L2 === "arbitrum") {
    return getArbitrumL1Bytes(tx);
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
  if (options.L2 === "optimism" || options.L2 === "base") {
    switch (options.optimismHardfork){
      case "bedrock": return getOptimismBedrockL1Cost(gas, options.baseFee!);
      case "ecotone": return getOPStackEcotoneL1Cost(
        gas,
        options.baseFee!,
        options.blobBaseFee!,
        options.opStackBaseFeeScalar!,
        options.opStackBlobBaseFeeScalar!
      );
      default: return 0; /** This shouldn't happen */
    }
  }

  if (options.L2 === "arbitrum") {
    return getArbitrumL1Cost(gas, options.gasPrice!, options.baseFeePerByte!);
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
    if (options.L2 === "optimism" || options.L2 === "base") {
      calldataCost =  (cost / 1e9) * parseFloat(options.tokenPrice!);
    }
    if (options.L2 === "arbitrum") {
      executionGas += cost;
    }
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

/**
 * Converts wei `l1 fee estimate` to gwei estimated price per byte
 * @param val
 */
export function getArbitrumBaseFeePerByte(val: number): number {
  const gwei = (BigInt(16) * BigInt(val)) / BigInt(Math.pow(10, 9));
  return parseInt(gwei.toString());
}


