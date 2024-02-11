// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.5.8",
  gasReporter: {
    coinmarketcap: process.env.CMC_API_KEY,
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
