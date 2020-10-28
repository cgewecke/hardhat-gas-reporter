import { readFileSync } from "fs";
import { TASK_TEST_RUN_MOCHA_TESTS } from "hardhat/builtin-tasks/task-names";
import { internalTask } from "hardhat/config";
import {
  ensurePluginLoadedWithUsePlugin,
  HARDHATEVM_NETWORK_NAME
} from "hardhat/plugins";
import { wrapSend } from "hardhat/internal/core/providers/wrapper";
import AsyncProvider from "./provider";

import {
  ResolvedHardhatConfig,
  HardhatArguments,
  HttpNetworkConfig,
  NetworkConfig,
  IEthereumProvider
} from "hardhat/types";

import { EthGasReporterConfig } from "./types";

let mochaConfig;

/**
 * Method passed to eth-gas-reporter to resolve artifact resources. Loads
 * and processes JSON artifacts
 * @param  {string} artifactPath `config.paths.artifacts`
 * @param  {string} contractName parsed contract name
 * @return {any}                 object w/ abi and bytecode
 */
function artifactor(artifactPath: string, contractName : string) : any {
  let _artifact: any = {};
  let file : string = `${artifactPath}/${contractName}.json`;

  try {
    _artifact = JSON.parse(readFileSync(file, "utf-8"));
  } catch(err){
    throw err;
  }

  return {
    abi: _artifact.abi,
    bytecode: _artifact.bytecode,
    deployedBytecode: _artifact.deployedBytecode
  }
}

/**
 * Sets reporter options to pass to eth-gas-reporter:
 * > url to connect to client with
 * > artifact format (hardhat)
 * > solc compiler info
 * @param  {ResolvedHardhatConfig} config [description]
 * @param  {HardhatArguments}      args   [description]
 * @return {EthGasReporterConfig}         [description]
 */
function getDefaultOptions(
  config: ResolvedHardhatConfig,
  networkConfig: NetworkConfig
): EthGasReporterConfig {
  const defaultUrl = "http://localhost:8545";

  let url: any;
  let artifactType: any;

  // Resolve URL
  if ((<HttpNetworkConfig>networkConfig).url) {
    url = (<HttpNetworkConfig>networkConfig).url;
  } else {
    url = defaultUrl;
  }

  return {
    artifactType: artifactor.bind(null, config.paths.artifacts),
    enabled: true,
    url: <string>url,
    metadata: {
      compiler: {
        version: config.solc.version
      },
      settings: {
        optimizer: {
          enabled: config.solc.optimizer.enabled,
          runs: config.solc.optimizer.runs
        }
      }
    }
  };
}

/**
 * Merges GasReporter defaults with user's GasReporter config
 * @param  {ResolvedHardhatConfig} config
 * @param  {HardhatArguments}      args   command line args (e.g network)
 * @return {any}
 */
function getOptions(
  config: ResolvedHardhatConfig,
  networkConfig: NetworkConfig
): any {
  return { ...getDefaultOptions(config, networkConfig), ...(<any>config).gasReporter };
}

function createGasMeasuringProvider(
  provider: IEthereumProvider
){
  return wrapSend(provider, async (method, params) => {
    // Truffle
    if (method === "eth_getTransactionReceipt") {
      const receipt = await provider.send(method, params);
      if (receipt.status && receipt.transactionHash){
        const tx = await provider.send("eth_getTransactionByHash", [receipt.transactionHash]);
        await mochaConfig.attachments.recordTransaction(receipt, tx);
      }
      return receipt;

    // Ethers: will get run twice for deployments (e.g both receipt and txhash are fetched)
    } else if (method === 'eth_getTransactionByHash'){
      const receipt = await provider.send("eth_getTransactionReceipt", params)
      const tx = await provider.send(method, params)
      if (receipt.status){
        await mochaConfig.attachments.recordTransaction(receipt, tx)
      }
      return tx;
    }
    return provider.send(method, params);
  });
}

/**
 * Overrides TASK_TEST_RUN_MOCHA_TEST to (conditionally) use eth-gas-reporter as
 * the mocha test reporter and passes mocha relevant options. These are listed
 * on the `gasReporter` of the user's config.
 */
export default function() {
  internalTask(TASK_TEST_RUN_MOCHA_TESTS).setAction(
    async (args: any, hre, runSuper) => {
      const options = getOptions(hre.config, hre.network.config);

      if (options.enabled) {
        mochaConfig = hre.config.mocha || {};
        mochaConfig.reporter = "eth-gas-reporter";
        mochaConfig.reporterOptions = options;

        if (hre.network.name === HARDHATEVM_NETWORK_NAME || options.fast){
          hre.network.provider = createGasMeasuringProvider(hre.network.provider);
          mochaConfig.reporterOptions.provider = new AsyncProvider(hre.network.provider);
          mochaConfig.reporterOptions.blockLimit = (<any>hre.network.config).blockGasLimit as number;
          mochaConfig.attachments = {};
        }

        hre.config.mocha = mochaConfig;
      }

      await runSuper();
    }
  );
}
