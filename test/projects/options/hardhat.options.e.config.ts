/**
 * TESTS:
 * + Default Terminal Format
 * + L2: Optimism
 * + Live market prices
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  mocha: {
    reporter: 'dot'
  },
  gasReporter: {
    coinmarketcap: process.env.CMC_API_KEY,
    L2: "optimism",
    gasPriceApi: "https://api-optimistic.etherscan.io/api?module=proxy&action=eth_gasPrice",
    enabled: true,
  }
};

// eslint-disable-next-line import/no-default-export
export default config;