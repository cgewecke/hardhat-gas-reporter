import { Collector } from "./lib/collector";
import { GasData } from "./lib/gasData";
import { Resolver } from "./lib/resolvers";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    gasReporter?: GasReporterOptions;
  }
}

export type ArbitrumHardfork = "arbOS11" | "arbOS20" | undefined;
export type OptimismHardfork = "bedrock" | "ecotone" | undefined;

export interface GasReporterOptions {

  /** @property Gwei base fee per gas unit. */
  /*
   * NB: Used to calculate L1 calldata costs for L2 transactions and typically obtained via api call
   * to etherscan for the latest blockheader via option `getBlockApi`
   */
  baseFee?: number;

  /** @property Gwei blob base fee per gas unit */
  /*
   * Used to calculate L1 calldata costs post EIP-7516 and typically obtained via api call
   *to etherscan for the latest blockheader via option `getBlockApi`
   */
  blobBaseFee?: number;

  /** @property API key to access token/currency market price data with */
  coinmarketcap?: string;

  /** @property Coinmarketcap currency code to denominate network token costs in (eg: "USD") */
  currency?: string;

  /** @property: Decimal precision of nation state currency costs display */
  currencyDisplayPrecision?: number;

  /** @property Use colors easier to see on dark backgrounds when rendering to terminal  */
  darkMode?: boolean;

  /** @property Enable plugin */
  enabled?: boolean;

  /** @property Filters out gas reporting for solc generated public state & storage vars */
  excludeAutoGeneratedGetters?: boolean;

  /** @property List of contract names to exclude from report (e.g "Ownable") */
  excludeContracts?: string[];

  /** @property Write to terminal even when saving output to file */
  forceTerminalOutput?: boolean;

  /** @property Table format to output forced terminal output in */
  forceTerminalOutputFormat?: 'legacy' | 'terminal' | 'markdown';

  /** @property Gwei price per gas unit (eg: 20) */
  gasPrice?: number;

  /** @property Etherscan-like url to fetch live execution network gas price from */
  gasPriceApi?: string;

  /** @property Etherscan-like url to fetch L1 block header from */
  getBlockApi?: string

  /** @property Include standard 21_000 + calldata bytes fees in method gas usage data */
  includeIntrinsicGas?: boolean;

  // TODO: Enable arbitrum when support added
  /** @property L2 Network to calculate execution costs for */
  L2?: "optimism" // | "arbitrum"

  /** @property Omit terminal color in output */
  noColors?: boolean;

  /** @property Never make a remote call to fetch data */
  offline?: boolean;

  /** @property Optimism client version to emulate gas costs for. Only applied when L2 is "optimism" */
  optimismHardfork?: OptimismHardfork,

  /** @property Relative path to a file to output terminal table to (instead of stdout) */
  outputFile?: string;

  /** @property Write JSON object with all options, methods, deployment data to file */
  outputJSON?: boolean

  /** @property: Relative path to a file to output JSON data to */
  outputJSONFile?: string,

  /** @property User-defined class with methods to help reporter identify targets of proxied calls */
  proxyResolver?: CustomGasReporterResolver

  /** @property List of forked-network deployed contracts to track execution costs for */
  remoteContracts?: RemoteContract[];

  /** @property Report format identfiers */
  reportFormat?: "legacy" | "terminal" | "markdown";

  /** @property Track gas usage for methods using eth_call */
  reportPureAndViewMethods?: boolean;

  /** @property Format table output for `rst` documentation (eg sphinx, ReadTheDocs)   */
  rst?: boolean;

  /** @property Optional title for `rst` documentation */
  rstTitle?: string;

  /** @property  Display the complete function signature of methods */
  showMethodSig?: boolean;

  /** @property Lists all methods and deployments, even if no transactions were recorded for them */
  showUncalledMethods?: boolean;

  /** @property Skips writing the table to std out */
  suppressTerminalOutput?: boolean;

  /** @property Network token gas fees are paid in (eg:"ETH") */
  token?: string;

  /** @property Network token price per nation state currency unit, to two decimal places (eg: "2145.00") */
  tokenPrice?: string;

  // ====================================
  // INTERNAL: AUTOSET BY PLUGIN or STUBS
  // =====================================
  /** @ignore */
  solcInfo?: any;

  /** @ignore */
  blockGasLimit?: number;

  /** @ignore Arbitrum client version to emulate gas costs for. Only applied when L2 is "arbitrum" */
  arbitrumHardfork?: ArbitrumHardfork,
}

export interface GasReporterExecutionContext {
  collector?: Collector,
  task?: string,
  usingOZ?: boolean,
  usingViem?: boolean,
  usingCall?: boolean,
  blockGasLimit?: number;
  methodsTotalGas?: number,
  methodsTotalCost?: string,
  methodIgnoreList?: string[],
  deploymentsTotalGas?: number,
  deploymentsTotalCost?: string
}

export interface RemoteContract {
  abi: any;
  address: string;
  name: string;
  bytecode?: string;
  bytecodeHash?: string;
  deployedBytecode?: string;
}

export interface Deployment {
  name: string;
  bytecode: string;
  deployedBytecode: string;
  gasData: number[];
}

/**
 * Type for the object generated by eth-gas-reporter on gasReporterOutput.json files.
 * More info: https://github.com/cgewecke/eth-gas-reporter/blob/master/docs/gasReporterOutput.md
 */
export interface GasReporterOutput {
  namespace: string;
  toolchain: string;
  version: string;
  options: GasReporterOptions,
  data?: GasData
}

export interface MethodDataItem {
  key: string,
  isCall: boolean,
  contract: string,
  method: string,
  fnSig: string,
  callData: number[],
  gasData: number[],
  numberOfCalls: number,
  min?: number,
  max?: number,
  executionGasAverage?: number,
  calldataGasAverage?: number,
  cost?: string,
}

export interface MethodData {[key: string]: MethodDataItem }

export interface Deployment {
  name: string,
  bytecode: string,
  deployedBytecode: string,
  callData: number[],
  gasData: number[],
  min?: number,
  max?: number,
  executionGasAverage?: number,
  calldataGasAverage?: number,
  cost?: string,
  percent?: number
}

export interface SolcInfo {
  version: string,
  optimizer: string,
  runs: number | string,
  viaIR: boolean
}

export interface ArtifactInfo {
  abi: any[],
  bytecode: string,
  deployedBytecode: string,
  address? : string,
  bytecodeHash?: string,
}

export interface ContractInfo {
  name: string,
  excludedMethods: string[],
  artifact: ArtifactInfo
}

// Partial: borrowed from ethereumjs/tx to avoid adding package
export interface JsonRpcTx {
  input: string
  data?: string
  to: string | null
  from: string
  gas: string
  gasPrice: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  type: string
  accessList?: any['accessList']
  chainId?: string
  hash: string
  nonce: string
  value: string
  // maxFeePerBlobGas?: string // QUANTITY - max data fee for blob transactions
  // blobVersionedHashes?: string[] // DATA - array of 32 byte versioned hashes for blob transactions
}

export interface FakeTx {
  input: string,
  to: string,
  isCall: true
}

export interface ValidatedRequestArguments {
  params: [{
    data: string,
    to: string
  }];
};

// Partial: borrowed from ethereumjs/block to avoid adding package
export interface JsonRpcBlock {
  gasLimit: string        // the data send along with the transaction.
  baseFeePerGas: string   // If EIP-1559 is enabled for this block, returns the base fee per gas
}

export interface MinimalInterpreterStep {
  gasLeft: bigint
  gasRefund: bigint
  stack: bigint[]
  opcode: {
    name: string
    fee: number
    dynamicFee?: bigint
    isAsync: boolean
  }
}

export interface CustomGasReporterResolver {
  ignore: () => string[];
  resolve: (this: Resolver, transaction: JsonRpcTx) => Promise<string | null>;
}


