/**
 * TESTS:
 * + user-configured token and gasPrice
 * + write-to-custom-file-name (JSON & txt)
 * + force terminal output w/ custom output
 * + show uncalled methods
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomicfoundation/hardhat-ethers";
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
    enabled: true,
    token: "ETC",
    tokenPrice: "200.00",
    gasPrice: 40,
    showUncalledMethods: true,
    outputFile: "./testGasReport.txt",
    outputJSONFile: "./gas.json",
    forceTerminalOutput: true,
    forceTerminalOutputFormat: 'legacy'
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
