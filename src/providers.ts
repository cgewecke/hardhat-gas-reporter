import { ProviderWrapper } from "hardhat/internal/core/providers/wrapper";
import {
  EthereumProvider,
  EIP1193Provider,
  RequestArguments,
} from "hardhat/types";

export type Sniffer = (request: {
  args: RequestArguments;
  result: Promise<unknown>;
  provider: EIP1193Provider;
}) => Promise<void> | void;

/**
 * Wrapped provider which sniffs requests
 */
export class SnifferProvider extends ProviderWrapper {
  private sniffers: Sniffer[] = [];

  constructor(provider: EIP1193Provider) {
    super(provider);
  }

  public addSniffer(sniffer: Sniffer) {
    this.sniffers.push(sniffer);
  }

  public async request(args: RequestArguments): Promise<unknown> {
    const result = (async () => await this._wrappedProvider.request(args))();
    await Promise.all(
      this.sniffers.map(
        async (sniffer) =>
          await sniffer({
            args,
            provider: this._wrappedProvider,
            result,
          })
      )
    );
    return await result;
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
