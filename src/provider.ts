/**
 * A set of async RPC calls which substitute the sync calls made by the core reporter
 * These allow us to use BuidlerEVM or another in-process provider.
 */

import { IEthereumProvider } from "@nomiclabs/buidler/types";

export default class AsyncProvider {
  public provider: IEthereumProvider;

  constructor(provider: IEthereumProvider) {
    this.provider = provider;
  }

  async getNetworkId() {
    return this.provider.send("net_version", []);
  }

  async getCode(address: string) {
    return this.provider.send("eth_getCode", [address, "latest"]);
  }

  async getLatestBlock() {
    return this.provider.send("eth_getBlockByNumber", ["latest", false]);
  }

  async getBlockByNumber(num: number) {
    const hexNumber = `0x${num.toString(16)}`;
    return this.provider.send("eth_getBlockByNumber", [hexNumber, true]);
  }

  async blockNumber() {
    const block = await this.getLatestBlock();
    return parseInt(block.number, 16);
  }

  async getTransactionByHash(tx) {
    return this.provider.send("eth_getTransactionByHash", [tx]);
  }

  async call(payload, blockNumber) {
    return this.provider.send("eth_call", [payload, blockNumber]);
  }
}
