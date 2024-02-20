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
    enabled: true,
    token: "ETC",
    tokenPrice: "200.00",
    gasPrice: 40,
    showUncalledMethods: true,
    outputFile: "./testGasReport.txt",
    outputJSONFile: "./gas.json",
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
