import { ProviderWrapper } from "hardhat/plugins";

import { EIP1193Provider, RequestArguments } from "hardhat/types";
import { hexToDecimal } from "../utils/gas";

import { GasReporterExecutionContext, JsonRpcTx, ValidatedRequestArguments } from "../types";

/**
 * Wrapped provider which collects tx data
 */
export class GasReporterProvider extends ProviderWrapper {
  public isInitialized = false;
  private _executionContext: GasReporterExecutionContext | undefined;

  constructor(provider: EIP1193Provider) {
    super(provider);
  }

  /**
   * extendProvider doesn't expose the environment but that's where we store data
   * and context stuff while bookending the start & finish of other tasks
   * @param {GasReporterExecutionContext} context
   */
  public initializeGasReporterProvider(context: GasReporterExecutionContext) {
    this.isInitialized = true;
    this._executionContext = context;
  }

  /**
   * Handles calls for TruffleV5
   * @param {RequestArguments} args
   * @returns {Promise<any>}
   */
  private async _handleTruffleV5(args: RequestArguments): Promise<any> {
    const receipt: any = await this._wrappedProvider.request(args);

    if (receipt?.status && receipt?.transactionHash) {
      const tx = await this._wrappedProvider.request({
        method: "eth_getTransactionByHash",
        params: [receipt.transactionHash],
      });
      await this._executionContext!.collector?.collectTransaction(tx as JsonRpcTx, receipt);
    }
    return receipt;
  }

  /**
   * Handles calls for Ethers (`eth_getTransactionReceipt`). (Ethers calls this when tx is mined)
   * @param {RequestArguments} args
   * @returns {Promise<any>}
   */
  private async _handleEthers(args: RequestArguments): Promise<any> {
    const receipt: any = await this._wrappedProvider.request({
      method: "eth_getTransactionReceipt",
      params: args.params,
    });
    const tx = await this._wrappedProvider.request(args);
    if (receipt?.status) {
      await this._executionContext!.collector?.collectTransaction(tx as JsonRpcTx, receipt);
    }
    return tx;
  }

  /**
   * Handles calls for Waffle (`eth_sendRawTransaction`) and Viem (`eth_sendTransaction`)
   * @param {RequestArguments} args
   * @returns {Promise<any>}
   */
  private async _handleViemOrWaffle(args: RequestArguments): Promise<any> {
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
        await this._executionContext!.collector?.collectTransaction(tx as JsonRpcTx, receipt);
      }
    }
    return txHash;
  }

  /**
   * Handles `eth_call` (for pure and view fns)
   * @param {RequestArguments} args
   * @returns {Promise<any>}
   */
  private async _handleEthCall(args: RequestArguments): Promise<any> {
    let gas;
    if (this._canEstimate(args)){
      try {
        gas = await this._wrappedProvider.request({
          method: "eth_estimateGas",
          params: args.params,
        });

        // Converting inside try block b/c not sure what edge case
        // responses are for all providers
        gas = hexToDecimal(gas as string);
      } catch (err) {
        gas = null;
      }

      if (gas) {
        await this._executionContext!.collector?.collectCall(
          args as ValidatedRequestArguments,
          gas
        );
      }
    }
    return this._wrappedProvider.request(args);
  }

  /**
   * Dispatch table for all the call routes required for different providers and call types
   * @param {RequestArguments} args
   * @returns {Promise<any>}
   */
  public async request(args: RequestArguments): Promise<unknown> {
    if (!this.isInitialized) {
      return this._wrappedProvider.request(args);
    }

    switch(args.method) {
      case "eth_call": return this._handleEthCall(args);
      case "eth_getTransactionReceipt": return this._handleTruffleV5(args);
      case "eth_getTransactionByHash": return this._handleEthers(args);
      case "eth_sendRawTransaction": return this._handleViemOrWaffle(args);
      case "eth_sendTransaction": return (this._executionContext!.usingViem)
        ? this._handleViemOrWaffle(args)
        : this._wrappedProvider.request(args);
      default: return this._wrappedProvider.request(args);
    }
  }

  /**
   * Used by `eth_call` to check that we're tracking calls and that the call being made is
   * not disallowed by a Resolver. Resolvers need to make private calls to establish proxied
   * contract identities - if we don't filter them here we get stuck in an infinite loop.
   * @param args
   * @returns
   */
  private _canEstimate(args: RequestArguments) {
    if (!this._executionContext?.usingCall) return false;

    if (
      Array.isArray(args.params) &&
      args.params.length >=1 &&
      typeof(args.params[0].data) === "string"
    ) {
      const sig = args.params[0].data.slice(2,10);
      for (const method of this._executionContext!.methodIgnoreList!){
        if (method === sig) return false;
      }
    }
    // Only filtering the ignore list here, not any other issues
    return true;
  }
}
