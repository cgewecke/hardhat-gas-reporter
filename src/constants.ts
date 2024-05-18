export const TABLE_NAME_LEGACY = "legacy";
export const TABLE_NAME_TERMINAL = "terminal";
export const TABLE_NAME_MARKDOWN = "markdown";

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_CURRENCY_DISPLAY_PRECISION = 2;
export const DEFAULT_JSON_OUTPUT_FILE = "./gasReporterOutput.json";
export const DEFAULT_GAS_PRICE_PRECISION = 5;

// Selector generated with: ethersV5.Interface.encodeFunctionData("blobBaseFee()", []);
export const DEFAULT_BLOB_BASE_FEE_API_ARGS = "action=eth_call&data=0xf8206140&tag=latest&to="

export const DEFAULT_GET_BLOCK_API_ARGS = "action=eth_getBlockByNumber&tag=latest&boolean=false"
export const DEFAULT_GAS_PRICE_API_ARGS  = "action=eth_gasPrice"
export const DEFAULT_API_KEY_ARGS = "&apikey="
export const DEFAULT_COINMARKET_BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/"

export const DEFAULT_OPTIMISM_HARDFORK = "ecotone";
export const DEFAULT_ARBITRUM_HARDFORK = "arbOS11";

export const TOOLCHAIN_HARDHAT = "hardhat";
export const TOOLCHAIN_FOUNDRY = "foundry";

export const CACHE_FILE_NAME = ".hardhat_gas_reporter_output.json";

// EVM
export const EVM_BASE_TX_COST = 21000;
export const DEFAULT_BLOB_BASE_FEE = 10; // gwei

// Source:
// https://docs.optimism.io/stack/transactions/fees#bedrock
export const OPTIMISM_BEDROCK_FIXED_OVERHEAD = 188;
export const OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD = 0.684;

// These params are configured by node operators and may vary
// Values were read from the GasPriceOracle contract at:
// https://optimistic.etherscan.io/address/0x420000000000000000000000000000000000000F
export const OPTIMISM_ECOTONE_BASE_FEE_SCALAR = 1368
export const OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR = 810949

// https://basescan.org/address/0x420000000000000000000000000000000000000F
export const BASE_ECOTONE_BASE_FEE_SCALAR = 1101;
export const BASE_ECOTONE_BLOB_BASE_FEE_SCALAR = 659851;

export const UNICODE_CIRCLE = "◯";
export const UNICODE_TRIANGLE = "△"

export const RANDOM_R_COMPONENT = "0x12354631f8e7f6d04a0f71b4e2a7b50b165ad2e50a83d531cbd88587b4bd62d5";
export const RANDOM_S_COMPONENT = "0x49cd68893c5952ea1e00288b05699be582081c5fba8c2c6f6e90dd416cdc2e07";

/**
 * Generated with:
 *
 * erc20Calldata = ethersV5.Interface.encodeFunctionData("decimals()", [])
 *
 * ethersV5.Interface.encodeFunctionData(
 *   "gasEstimateL1Component(address to, bool contractCreation, bytes calldata data)",
 *   [
 *       "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC
 *       false,
 *       erc20Calldata
 *   ]
 * );
 *
 */
export const ARBITRUM_L1_ESTIMATE_CALLDATA = "0x77d488a2000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e5831000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000004313ce56700000000000000000000000000000000000000000000000000000000";

// Source: @arbitrum/sdk/dist/lib/dataEntities/constants
export const ARBITRUM_NODE_INTERFACE_ADDRESS = "0x00000000000000000000000000000000000000C8";

export const DEFAULT_BASE_FEE_PER_BYTE_API_ARGS =
  `action=eth_call&data=${ARBITRUM_L1_ESTIMATE_CALLDATA}&tag=latest&to=${ARBITRUM_NODE_INTERFACE_ADDRESS}`;

export const OPTIMISM_GAS_ORACLE_ABI_PARTIAL = [
{
  constant: true,
  inputs: [],
  name: "blobBaseFee",
  outputs: [
    {
      name: "",
      type: "uint256",
    },
  ],
  payable: false,
  stateMutability: "view",
  type: "function",
},
{
  constant: true,
  inputs: [],
  name: "baseFeeScalar",
  outputs: [
    {
      name: "",
      type: "uint32",
    },
  ],
  payable: false,
  stateMutability: "view",
  type: "function",
},
{
  constant: true,
  inputs: [],
  name: "blobBaseFeeScalar",
  outputs: [
    {
      name: "",
      type: "uint32",
    },
  ],
  payable: false,
  stateMutability: "view",
  type: "function",
}];

