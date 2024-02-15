
import type {Config} from "./config";
import type {GasData} from "./gasData";
import type { EGRAsyncApiProvider } from "./providers";
import { JsonRpcTx } from "../types";

export class ProxyResolver {
  public unresolvedCalls: number;
  public data: GasData;
  public provider: EGRAsyncApiProvider;
  public resolveByProxy: Function;

  constructor(config: Config, provider: EGRAsyncApiProvider, data: GasData) {
    this.unresolvedCalls = 0;
    this.data = data;
    this.provider = provider;

    if (typeof config.proxyResolver === "function") {
      this.resolveByProxy = config.proxyResolver.bind(this);
    } else {
      this.resolveByProxy = this.resolveByMethodSignature;
    }
  }

  /**
   * Searches all known contracts for the method signature and returns the first
   * found (if any). Undefined if none
   * @param  {Object} tx          result of web3.eth_getTransaction
   * @return {String}             contract name
   */
  public resolveByMethodSignature(tx: JsonRpcTx): string | null {
    const signature = tx.input.slice(2, 10);
    const matches = this.data.getAllContractsWithMethod(signature);

    if (matches.length >= 1) return matches[0].contract;
    return null;
  }

  /**
   * Tries to match bytecode deployed at address to deployedBytecode listed
   * in artifacts. If found, adds this to the code-hash name mapping and
   * returns name.
   * @param  {String} address contract address
   * @return {String}         contract name
   */
  async public resolveByDeployedBytecode(address: string | null): Promise<string | null> {
    if (!address) return null;

    const code = await this.provider.getCode(address);
    const match = this.data.getContractByDeployedBytecode(code);

    if (match !== null) {
      await this.data.trackNameByAddress(match.name, address);
      return match.name;
    }
    return null;
  }
}
