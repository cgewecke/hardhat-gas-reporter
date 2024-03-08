/**
 * TESTS:
 * + Markdown format
 * + L2: Optimism
 * + Live market prices in CHF
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomicfoundation/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  mocha: {
    reporter: 'dot'
  },
  gasReporter: {
    currency: "CHF",
    token: "ETH",
    coinmarketcap: process.env.CMC_API_KEY,
    L2: "optimism",
    gasPrice: 0.098775564,
    baseFee: 79,
    reportFormat: "markdown",
    enabled: true
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
