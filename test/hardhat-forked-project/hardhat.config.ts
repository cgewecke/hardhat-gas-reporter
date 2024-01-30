// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers"
import { ABI } from "./abi";

import "../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.4.18",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_TOKEN}`
      }
    }
  },
  mocha: {
    timeout: 100000
  },
  gasReporter: {
    remoteContracts: [{
      name: "WETH",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      abi: ABI.wethABI
    }]
  }
};

export default config;