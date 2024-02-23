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
    currency: "CHF",
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    coinmarketcap: process.env.CMC_API_KEY,
    L2: "optimism",
    L2gasPriceApi: "https://api-optimistic.etherscan.io/api?module=proxy&action=eth_gasPrice",
    reportFormat: "markdown",
    showMethodSig: true,
    enabled: true,
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
