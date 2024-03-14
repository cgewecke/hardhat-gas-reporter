/**
 * TESTS:
 * + Complex compiler details
 * + Non-ethereum L1 (polygon) with live market price
 * + Custom gasPrice API call
 * + Exclude contracts from reporting
 * + Display full method signature
 * + Dark mode
 * + RST titles
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomicfoundation/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";
import { EtherRouterResolver } from "../../../src/lib/resolvers/etherrouter";

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
    L1: "polygon",
    L1Etherscan: process.env.POLYGONSCAN_API_KEY,
    coinmarketcap: process.env.CMC_API_KEY,
    rst: true,
    rstTitle: "Polygon Report",
    excludeContracts: ["EtherRouter/EtherRouter.sol"],
    showMethodSig: true,
    enabled: true,
    darkMode: true,
    proxyResolver: new EtherRouterResolver(),
    includeBytecodeInJSON: true
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
