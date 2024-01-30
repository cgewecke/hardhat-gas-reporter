// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";
import "../../src/index";
import "@nomicfoundation/hardhat-viem";

const config: HardhatUserConfig = {
  solidity: "0.5.8",
};

export default config;
