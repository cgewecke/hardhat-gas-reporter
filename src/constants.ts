export const TABLE_NAME_LEGACY = "legacy";
export const TABLE_NAME_TERMINAL = "terminal";
export const TABLE_NAME_MARKDOWN = "markdown";

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_CURRENCY_DISPLAY_PRECISION = 2;
export const DEFAULT_JSON_OUTPUT_FILE = "./gasReporterOutput.json";
export const DEFAULT_GAS_PRICE_PRECISION = 7;

export const DEFAULT_GET_BLOCK_API_ARGS = "action=eth_getBlockByNumber&tag=latest&boolean=false"
export const DEFAULT_GAS_PRICE_API_ARGS  = "action=eth_gasPrice"
export const DEFAULT_API_KEY_ARGS = "&apikey="
export const DEFAULT_COINMARKET_BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/"

export const DEFAULT_OPTIMISM_HARDFORK = "bedrock";
export const DEFAULT_ARBITRUM_HARDFORK = "arbOS11";

export const TOOLCHAIN_HARDHAT = "hardhat";
export const TOOLCHAIN_FOUNDRY = "foundry";

// EVM
export const EVM_BASE_TX_COST = 21000;

// Source:
// https://docs.optimism.io/stack/transactions/fees#bedrock
export const OPTIMISM_BEDROCK_FIXED_OVERHEAD = 188;
export const OPTIMISM_BEDROCK_DYNAMIC_OVERHEAD = 0.684;

// These params are configured by node operators and may vary
// Values are suggested default values from:
// https://docs.optimism.io/builders/chain-operators/management/blobs
export const OPTIMISM_ECOTONE_BASE_FEE_SCALAR = 11000
export const OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR = 1087000

export const UNICODE_CIRCLE = "◯";
export const UNICODE_TRIANGLE = "△"
