import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployment, MethodData, MethodDataItem } from "./types";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function findMethod(
  methods: MethodData,
  contractName: string,
  methodName: string
) : MethodDataItem | null {
  for (const key of Object.keys(methods)){
    if (methods[key].contract === contractName && methods[key].method === methodName) {
      return methods[key];
    }
  }
  return null;
}

export function findDeployment(
  deployments: Deployment[],
  contractName: string,
) : Deployment | null {
  for (const deployment of deployments){
    if (deployment.name === contractName) {
      return deployment;
    }
  }
  return null;
}

export function useEnvironment(
  projectPath: string,
  networkName?: string,
  configPath?: string
) {
  before("Loading hardhat environment", async function () {
    process.chdir(projectPath);

    // Writes the data to a JSON file
    process.env.CI = "true";

    if (networkName !== undefined) {
      process.env.HARDHAT_NETWORK = networkName;
    }

    if (configPath !== undefined) {
      process.env.HARDHAT_CONFIG = configPath
    }

    this.env = require("hardhat");
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });
}
