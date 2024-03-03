// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomicfoundation/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

if (process.env.ALCHEMY_TOKEN === undefined) {
  throw new Error("Forked hardhat test requires ALCHEMY_TOKEN set in env");
}

const config: HardhatUserConfig = {
  solidity: "0.7.6",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_TOKEN!}`,
        blockNumber: 18_000_000
      },
    },
  },
  mocha: {
    timeout: 200_000,
    reporter: "dot"
  },
  gasReporter: {},
};

// eslint-disable-next-line import/no-default-export
export default config;



