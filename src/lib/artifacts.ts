import path from "path";

import { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";

import { RemoteContract, ContractInfo, GasReporterOptions } from "../types";

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
  provider: EthereumProvider,
  remoteContracts: RemoteContract[] = []
): Promise<RemoteContract[]> {
  const { default: sha1 } = await import("sha1");
  for (const contract of remoteContracts) {
    try {
      contract.bytecode = await provider.send("eth_getCode", [contract.address, "latest"]);
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
 * @param  {String}                    resolvedQualifiedNames
 * @return {object[]}                                   objects w/ abi and bytecode
 */
export async function getContracts(
  hre: HardhatRuntimeEnvironment,
  options: GasReporterOptions,
): Promise<ContractInfo[]> {
  const contracts = [];

  const resolvedRemoteContracts = await getResolvedRemoteContracts(
    hre.network.provider,
    options.remoteContracts
  );

  const resolvedQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames();

  for (const qualifiedName of resolvedQualifiedNames) {
    if (shouldSkipContract(qualifiedName, options.excludeContracts!)) {
      continue;
    }

    let name: string;
    let artifact = hre.artifacts.readArtifactSync(qualifiedName);

    // Prefer simple names
    try {
      artifact = hre.artifacts.readArtifactSync(artifact.contractName);
      name = artifact.contractName;
    } catch (e) {
      name = path.relative(hre.config.paths.sources, qualifiedName);;
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
        address: remoteContract.address,
        bytecode: remoteContract.bytecode,
        bytecodeHash: remoteContract.bytecodeHash,
        deployedBytecode: remoteContract.deployedBytecode,
      },
    } as ContractInfo);
  }
  return contracts;
}
