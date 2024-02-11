// TODO: figure out receipt boolean checking
/* eslint-disable @typescript-eslint/strict-boolean-expressions */

import {
  EIP1193Provider,
  EthereumProvider,
  HardhatRuntimeEnvironment,
  RequestArguments,
} from "hardhat/types";

import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";

/**
 * Wrapped provider which collects tx data
 */
export class EGRDataCollectionProvider extends ProviderWrapper {
  private _mochaConfig: any;

  constructor(provider: EIP1193Provider, mochaConfig: any) {
    super(provider);
    this._mochaConfig = mochaConfig;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    // Truffle
    if (args.method === "eth_getTransactionReceipt") {
      const receipt: any = await this._wrappedProvider.request(args);
      if (receipt?.status && receipt?.transactionHash) {
        const tx = await this._wrappedProvider.request({
          method: "eth_getTransactionByHash",
          params: [receipt.transactionHash],
        });
        await this._mochaConfig.attachments.recordTransaction(receipt, tx);
      }
      return receipt;

      // Ethers: will get run twice for deployments (e.g both receipt and txhash are fetched)
    } else if (args.method === "eth_getTransactionByHash") {
      const receipt: any = await this._wrappedProvider.request({
        method: "eth_getTransactionReceipt",
        params: args.params,
      });
      const tx = await this._wrappedProvider.request(args);
      if (receipt?.status) {
        await this._mochaConfig.attachments.recordTransaction(receipt, tx);
      }
      return tx;

      // Waffle: This is necessary when using Waffle wallets. eth_sendTransaction fetches the
      // transactionHash as part of its flow, eth_sendRawTransaction *does not*.
    } else if (args.method === "eth_sendRawTransaction") {
      const txHash = await this._wrappedProvider.request(args);

      if (typeof txHash === "string") {
        const tx = await this._wrappedProvider.request({
          method: "eth_getTransactionByHash",
          params: [txHash],
        });
        const receipt: any = await this._wrappedProvider.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt?.status) {
          await this._mochaConfig.attachments.recordTransaction(receipt, tx);
        }
      }
      return txHash;
    }
    return this._wrappedProvider.request(args);
  }
}

/**
 * A set of async RPC calls which substitute the sync calls made by the core reporter
 * These allow us to use HardhatEVM or another in-process provider.
 */
export class EGRAsyncApiProvider {
  public provider: EthereumProvider;

  constructor(provider: EthereumProvider) {
    this.provider = provider;
  }

  public async getNetworkId() {
    return this.provider.send("net_version", []);
  }

  public async getCode(address: string) {
    return this.provider.send("eth_getCode", [address, "latest"]);
  }

  public async getLatestBlock() {
    return this.provider.send("eth_getBlockByNumber", ["latest", false]);
  }

  public async getBlockByNumber(num: number) {
    const hexNumber = `0x${num.toString(16)}`;
    return this.provider.send("eth_getBlockByNumber", [hexNumber, true]);
  }

  public async blockNumber() {
    const block = await this.getLatestBlock();
    return parseInt(block.number, 16);
  }

  public async getTransactionByHash(tx: string) {
    return this.provider.send("eth_getTransactionByHash", [tx]);
  }

  public async call(payload: any, blockNumber: any) {
    return this.provider.send("eth_call", [payload, blockNumber]);
  }
}

export async function wrapProviders(
  hre: HardhatRuntimeEnvironment,
  mochaConfig: any
): Promise<{
  wrappedDataProvider: EGRDataCollectionProvider;
  asyncProvider: EGRAsyncApiProvider;
}> {
  const { BackwardsCompatibilityProviderAdapter } = await import(
    "hardhat/internal/core/providers/backwards-compatibility"
  );

  const wrappedDataProvider = new EGRDataCollectionProvider(
    hre.network.provider,
    mochaConfig
  );
  hre.network.provider = new BackwardsCompatibilityProviderAdapter(
    wrappedDataProvider
  );

  const asyncProvider = new EGRAsyncApiProvider(hre.network.provider);

  return { wrappedDataProvider, asyncProvider };
}
