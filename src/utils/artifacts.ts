import type { EGRAsyncApiProvider as EGRAsyncApiProviderT } from "./providers";
import { Artifacts } from "hardhat/types";

import { RemoteContract } from "../types";

/**
 * Filters out contracts to exclude from report
 * @param  {string}   qualifiedName        HRE artifact identifier
 * @param  {string[]} skippable            excludeContracts option values
 * @return {boolean}
 */
function shouldSkipContract(
  qualifiedName: string,
  skippable: string[]
): boolean {
  for (const item of skippable) {
    if (qualifiedName.includes(item)) {
      return true;
    }
  }
  return false;
}

/**
 * Fetches remote bytecode at address and hashes it so these addresses can be
 * added to the tracking at eth-gas-reporter synchronously on init.
 * @param  {EGRAsyncApiProvider}   provider
 * @param  {RemoteContract[] = []} remoteContracts
 * @return {Promise<RemoteContract[]>}
 */
export async function getResolvedRemoteContracts(
  provider: EGRAsyncApiProviderT,
  remoteContracts: RemoteContract[] = []
): Promise<RemoteContract[]> {
  const { default: sha1 } = await import("sha1");
  for (const contract of remoteContracts) {
    try {
      contract.bytecode = await provider.getCode(contract.address);
      contract.deployedBytecode = contract.bytecode;
      contract.bytecodeHash = sha1(contract.bytecode!);
    } catch (error: any) {
      console.log(
        `Warning: failed to fetch bytecode for remote contract: ${contract.name}`
      );
      console.log(`Error was: ${error}\n`);
    }
  }
  return remoteContracts;
}

/**
 * Method passed to eth-gas-reporter to resolve artifact resources. Loads
 * and processes JSON artifacts
 * @param  {HardhatRuntimeEnvironment} hre.artifacts
 * @param  {String[]}                  skippable        contract *not* to track
 * @param  {RemoteContract[]}          resolvedRemoteContracts
 * @return {object[]}                                   objects w/ abi and bytecode
 */
export function getContracts(
  artifacts: Artifacts,
  skippable: string[] = [],
  resolvedRemoteContracts: RemoteContract[],
  resolvedQualifiedNames: string[]
): any[] {
  const contracts = [];

  for (const qualifiedName of resolvedQualifiedNames) {
    if (shouldSkipContract(qualifiedName, skippable)) {
      continue;
    }

    let name: string;
    let artifact = artifacts.readArtifactSync(qualifiedName);

    // Prefer simple names
    try {
      artifact = artifacts.readArtifactSync(artifact.contractName);
      name = artifact.contractName;
    } catch (e) {
      name = qualifiedName;
    }

    contracts.push({
      name,
      artifact: {
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode,
      },
    });
  }

  for (const remoteContract of resolvedRemoteContracts) {
    contracts.push({
      name: remoteContract.name,
      artifact: {
        abi: remoteContract.abi,
        bytecode: remoteContract.bytecode,
        bytecodeHash: remoteContract.bytecodeHash,
        deployedBytecode: remoteContract.deployedBytecode,
      },
    });
  }
  return contracts;
}
