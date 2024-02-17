// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-truffle5";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.5.5",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    development: {
      gas: 5000000,
      url: "http://localhost:8545",
    },
  },
  gasReporter: {
    coinmarketcap: process.env.CMC_API_KEY,
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
