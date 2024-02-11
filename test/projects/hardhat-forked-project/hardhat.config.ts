// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

import { ABI } from "./abi";

if (process.env.ALCHEMY_TOKEN === undefined) {
  throw new Error("Forked hardhat test requires ALCHEMY_TOKEN set in env");
}

const config: HardhatUserConfig = {
  solidity: "0.4.18",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_TOKEN!}`,
      },
    },
  },
  mocha: {
    timeout: 100000,
  },
  gasReporter: {
    remoteContracts: [
      {
        name: "WETH",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        abi: ABI.wethABI,
      },
    ],
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
