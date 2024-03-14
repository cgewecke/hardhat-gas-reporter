/* eslint-disable import/no-extraneous-dependencies */
import "@nomicfoundation/hardhat-ethers";
import '@openzeppelin/hardhat-upgrades';
import { HardhatUserConfig } from "hardhat/types";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  mocha: {
    reporter: "dot"
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
