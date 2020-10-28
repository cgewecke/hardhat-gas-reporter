import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(projectPath: string, networkName?: string) {
  let previousCWD: string;

  beforeEach("Loading hardhat environment", function() {
    process.chdir(projectPath);

    if (networkName !== undefined){
      process.env.HARDHAT_NETWORK = networkName;
    }

    this.env = require("hardhat");
  });

  afterEach("Resetting hardhat", function() {
    resetHardhatContext();
  });
}
