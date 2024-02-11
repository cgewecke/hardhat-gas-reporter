// We load the plugin here.
import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";

import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.5.8",
};

export default config;
