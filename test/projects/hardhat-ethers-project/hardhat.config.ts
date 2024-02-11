// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers"

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.5.8",
  gasReporter: {
    coinmarketcap: process.env.CMC_API_KEY
  }
};

export default config;
