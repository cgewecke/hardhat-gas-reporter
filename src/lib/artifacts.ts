import path from "path";
import _ from "lodash";
import {parse, visit} from "@solidity-parser/parser";
import { Interface } from "@ethersproject/abi";

import { getHashedFunctionSignature } from "../utils/sources";

import { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";
import { RemoteContract, ContractInfo, GasReporterOptions } from "../types";
import { FunctionFragment } from "ethers";

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
 * added to the tracking in the collector
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
 * Loads and processes artifacts
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
  const contracts: ContractInfo[] = [];

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
    let artifact = await hre.artifacts.readArtifact(qualifiedName);

    // Prefer simple names
    try {
      artifact = await hre.artifacts.readArtifact(artifact.contractName);
      name = artifact.contractName;
    } catch (e) {
      name = path.relative(hre.config.paths.sources, qualifiedName);;
    }

    contracts.push({
      name,
      excludedMethods: await getExcludedMethodKeys(hre, options, artifact.abi, name, qualifiedName),
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
      excludedMethods: [], // no source
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

/**
 * Parses each file in a contract's dependency tree to identify public StateVariables and
 * add them to a list of methods to exclude from the report. Enabled when
 * `excludeAutoGeneratedGetters` and `reportPureAndViewMethods` are both true.
 *
 * TODO: warn when files don't parse
 *
 * @param {HardhatRuntimeEnvironment} hre
 * @param {GasReporterOptions}        options
 * @param {string}                    name
 * @param {string}                    qualifiedName
 * @returns
 */
async function getExcludedMethodKeys(
  hre: HardhatRuntimeEnvironment,
  options: GasReporterOptions,
  abi: any[],
  contractName: string,
  contractQualifiedName: string
): Promise<string[]> {
  const excludedMethods: string[] = [];

  if (options.reportPureAndViewMethods && options.excludeAutoGeneratedGetters) {
    const info = await hre.artifacts.getBuildInfo(contractQualifiedName);
    const functions = new Interface(abi).functions

    if (info && info.input && info.input.sources) {
      _.forEach(info?.input.sources, (source) => {
        try {
          const ast = parse(source.content, {tolerant: true});
          visit(ast, {
            StateVariableDeclaration: function (node) {
              const publicVars = node.variables.filter(({ visibility }) => visibility === 'public');

              publicVars.forEach(_var => {
                const formattedName = Object.keys(functions).find(key => functions[key].name === _var.name);
                if (formattedName){
                  excludedMethods.push(`${contractName}_${getHashedFunctionSignature(formattedName)}`)
                }
              })
            }
          })
        } catch (err) { /* ignore */ }
      });
    }
  }
  return excludedMethods;
}
