import {
  EIP1193Provider,
  RequestArguments,
} from "hardhat/types";

import { ProviderWrapper } from "hardhat/plugins";

import { GasReporterExecutionContext, JsonRpcTx } from "../types";

/**
 * Wrapped provider which collects tx data
 */
export class GasReporterProvider extends ProviderWrapper {
  private _executionContext: GasReporterExecutionContext | undefined;

  constructor(provider: EIP1193Provider) {
    super(provider);
  }

  /**
   * extendProvider doesn't expose the environment but that's where we store data
   * and context stuff while bookending the start & finish of other tasks
   * @param {GasReporterExecutionContext} context
   */
  public _setGasReporterExecutionContext(context: GasReporterExecutionContext) {
    this._executionContext = context;
  }

  public async request(args: RequestArguments): Promise<unknown> {
    if (this._executionContext === undefined) {
      return this._wrappedProvider.request(args);
    }

    // hardhat-truffle-contract:
    if (args.method === "eth_getTransactionReceipt") {
      const receipt: any = await this._wrappedProvider.request(args);
      if (receipt?.status && receipt?.transactionHash) {
        const tx = await this._wrappedProvider.request({
          method: "eth_getTransactionByHash",
          params: [receipt.transactionHash],
        });
        await this._executionContext.collector?.collectTransaction(tx as JsonRpcTx, receipt);
      }
      return receipt;

    // hardhat-ethers: gets run twice for deployments (e.g both receipt and txhash are fetched)
    } else if (args.method === "eth_getTransactionByHash") {
      const receipt: any = await this._wrappedProvider.request({
        method: "eth_getTransactionReceipt",
        params: args.params,
      });
      const tx = await this._wrappedProvider.request(args);
      if (receipt?.status) {
        await this._executionContext.collector?.collectTransaction(tx as JsonRpcTx, receipt);
      }
      return tx;

    // hardhat-waffle: This is necessary when using Waffle wallets. eth_sendTransaction fetches the
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
          await this._executionContext.collector?.collectTransaction(tx as JsonRpcTx, receipt);
        }
      }
      return txHash;
    }
    return this._wrappedProvider.request(args);
  }
}
