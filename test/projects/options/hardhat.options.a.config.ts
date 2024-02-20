// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10_000
      },
      viaIR: true,
      evmVersion: "shanghai"
    }
  },
  mocha: {
    reporter: 'dot'
  },
  gasReporter: {
    currency: "CHF",
    token: "MATIC",
    gasPriceApi: "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
    coinmarketcap: process.env.CMC_API_KEY,
    rst: true,
    rstTitle: "Polygon Report",
    excludeContracts: ["EtherRouter/EtherRouter.sol"],
    showMethodSig: true,
    enabled: true,
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
