import "@nomiclabs/hardhat-truffle5"
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../src/index";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.5.5",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100
      }
    }
  },
  networks: {
    development: {
      gas: 5000000,
      url: "http://localhost:8545"
    }
  },
  gasReporter: {
    showMethodSig: true
  }
};

export default config;
