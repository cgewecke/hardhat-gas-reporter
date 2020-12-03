import sha1 from "sha1"
import { TASK_TEST_RUN_MOCHA_TESTS } from "hardhat/builtin-tasks/task-names";
import { subtask } from "hardhat/config";
import { HARDHAT_NETWORK_NAME } from "hardhat/plugins";
import {
  BackwardsCompatibilityProviderAdapter
} from "hardhat/internal/core/providers/backwards-compatibility"

import {
  EGRDataCollectionProvider,
  EGRAsyncApiProvider
} from "./providers";

import {
  HardhatArguments,
  HttpNetworkConfig,
  NetworkConfig,
  EthereumProvider,
  HardhatRuntimeEnvironment,
  Artifact,
  Artifacts
} from "hardhat/types";

import "./type-extensions"
import { EthGasReporterConfig, RemoteContract } from "./types";
const { parseSoliditySources } = require('eth-gas-reporter/lib/utils');

let mochaConfig;
let resolvedQualifiedNames: string[]
let resolvedRemoteContracts: RemoteContract[] = [];

/**
 * Filters out contracts to exclude from report
 * @param  {string}   qualifiedName HRE artifact identifier
 * @param  {string[]} skippable      excludeContracts option values
 * @return {boolean}
 */
function shouldSkipContract(qualifiedName: string, skippable: string[]): boolean {
  for (const item of skippable){
    if (qualifiedName.includes(item)) return true;
  }
  return false;
}

/**
 * Method passed to eth-gas-reporter to resolve artifact resources. Loads
 * and processes JSON artifacts
 * @param  {HardhatRuntimeEnvironment} hre.artifacts
 * @param  {String[]}                  skippable    contract *not* to track
 * @return {object[]}                  objects w/ abi and bytecode
 */
function getContracts(artifacts: Artifacts, skippable: string[] = []) : any[] {
  const contracts = [];

  for (const qualifiedName of resolvedQualifiedNames) {
    if (shouldSkipContract(qualifiedName, skippable)){
      continue;
    }

    let name: string;
    let artifact = artifacts.readArtifactSync(qualifiedName)

    // Prefer simple names
    try {
      artifact = artifacts.readArtifactSync(artifact.contractName);
      name = artifact.contractName;
    } catch (e) {
      name = qualifiedName;
    }

    contracts.push({
      name: name,
      artifact: {
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        deployedBytecode: artifact.deployedBytecode
      }
    });
  }

  for (const remoteContract of resolvedRemoteContracts){
    contracts.push({
      name: remoteContract.name,
      artifact: {
        abi: remoteContract.abi,
        bytecode: remoteContract.bytecode,
        bytecodeHash: remoteContract.bytecodeHash,
        deployedBytecode: remoteContract.deployedBytecode
      }
    })
  }
  return contracts;
}

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {EthGasReporterConfig}
 */
function getDefaultOptions(hre: HardhatRuntimeEnvironment): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545";
  const defaultCompiler = hre.config.solidity.compilers[0]

  let url: any;
  // Resolve URL
  if ((<HttpNetworkConfig>hre.network.config).url) {
    url = (<HttpNetworkConfig>hre.network.config).url;
  } else {
    url = defaultUrl;
  }

  return {
    enabled: true,
    url: <string>url,
    metadata: {
      compiler: {
        version: defaultCompiler.version
      },
      settings: {
        optimizer: {
          enabled: defaultCompiler.settings.optimizer.enabled,
          runs: defaultCompiler.settings.optimizer.runs
        }
      }
    }
  }
}

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {HardhatRuntimeEnvironment} hre
 * @return {any}
 */
function getOptions(hre: HardhatRuntimeEnvironment): any {
  return { ...getDefaultOptions(hre), ...(hre.config as any).gasReporter };
}

/**
 * Fetches remote bytecode at address and hashes it so these addresses can be
 * added to the tracking at eth-gas-reporter synchronously on init.
 * @param  {EGRAsyncApiProvider}   provider
 * @param  {RemoteContract[] = []} remoteContracts
 * @return {Promise<RemoteContract[]>}
 */
async function getResolvedRemoteContracts(
  provider: EGRAsyncApiProvider,
  remoteContracts: RemoteContract[] = []
) : Promise <RemoteContract[]> {
  for (const contract of remoteContracts){
    let code;
    try {
      contract.bytecode = await provider.getCode(contract.address);
      contract.deployedBytecode = contract.bytecode;
      contract.bytecodeHash = sha1(contract.bytecode);
    } catch (error){
      console.log(`Warning: failed to fetch bytecode for remote contract: ${contract.name}`)
      console.log(`Error was: ${error}\n`);
    }
  }
  return remoteContracts;
}

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
subtask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
  async (args: any, hre, runSuper) => {
    const options = getOptions(hre);
    options.getContracts = getContracts.bind(null, hre.artifacts, options.excludeContracts);

    if (options.enabled) {
      mochaConfig = hre.config.mocha || {};
      mochaConfig.reporter = "eth-gas-reporter";
      mochaConfig.reporterOptions = options;

      if (hre.network.name === HARDHAT_NETWORK_NAME || options.fast){
        const wrappedDataProvider= new EGRDataCollectionProvider(hre.network.provider,mochaConfig);
        hre.network.provider = new BackwardsCompatibilityProviderAdapter(wrappedDataProvider);

        const asyncProvider = new EGRAsyncApiProvider(hre.network.provider);
        resolvedRemoteContracts = await getResolvedRemoteContracts(
          asyncProvider,
          options.remoteContracts
        );

        mochaConfig.reporterOptions.provider = asyncProvider;
        mochaConfig.reporterOptions.blockLimit = (<any>hre.network.config).blockGasLimit as number;
        mochaConfig.attachments = {};
      }

      hre.config.mocha = mochaConfig;
      resolvedQualifiedNames = await hre.artifacts.getAllFullyQualifiedNames();
    }

    return runSuper();
  }
);

