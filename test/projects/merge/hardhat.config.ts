import { HardhatUserConfig } from "hardhat/types";

// We load the plugin here.
import "../../../src/index";

const config: HardhatUserConfig = {
  solidity: "0.5.8",
  mocha: {
    timeout: 10_000
  }
};

// eslint-disable-next-line import/no-default-export
export default config;
