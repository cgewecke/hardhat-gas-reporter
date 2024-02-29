import type {GasData} from "../gasData";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GasReporterOptions, JsonRpcTx } from "../../types";
import { customResolver as OZResolver } from "./oz";

export class Resolver {
  public unresolvedCalls: number;
  public data: GasData;
  public hre: HardhatRuntimeEnvironment;
  public resolveByProxy: Function;

  constructor(hre: HardhatRuntimeEnvironment, options: GasReporterOptions, data: GasData) {
    this.unresolvedCalls = 0;
    this.data = data;
    this.hre = hre;

    if (typeof options.proxyResolver === "function") {
      this.resolveByProxy = options.proxyResolver.bind(this);
    } else if (hre.__hhgrec.usingOZ) {
      this.resolveByProxy = OZResolver.bind(this);
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
  public async resolveByDeployedBytecode(address: string | null): Promise<string | null> {
    if (!address) return null;

    const code = await this.hre.network.provider.send("eth_getCode", [address, "latest"]);
    const match = this.data.getContractByDeployedBytecode(code);

    if (match !== null) {
      await this.data.trackNameByAddress(match.name, address);
      return match.name;
    }
    return null;
  }
}
