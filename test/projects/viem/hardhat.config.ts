// eslint-disable-next-line import/no-extraneous-dependencies
import "@nomicfoundation/hardhat-viem";
import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here (should work even if viem is first)
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  mocha: {
    reporter: "dot"
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
