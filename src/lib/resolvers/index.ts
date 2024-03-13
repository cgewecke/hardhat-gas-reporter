import type {GasData} from "../gasData";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CustomGasReporterResolver, GasReporterOptions, JsonRpcTx } from "../../types";

import { OZResolver } from "./oz";

export class Resolver {
  public unresolvedCalls: number;
  public data: GasData;
  public hre: HardhatRuntimeEnvironment;
  public resolveByProxy: Function;

  constructor(hre: HardhatRuntimeEnvironment, options: GasReporterOptions, data: GasData) {
    this.unresolvedCalls = 0;
    this.data = data;
    this.hre = hre;

    if (options.proxyResolver !== undefined) {
      this.resolveByProxy = (options.proxyResolver as CustomGasReporterResolver).resolve.bind(this);
    } else if (hre.__hhgrec.usingOZ) {
      this.resolveByProxy = new OZResolver().resolve.bind(this);
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

  /**
   * Helper for CustomResolvers which checks the existing contract address cache before
   * trying to resolve by deployed bytecode
   * @param contractAddress
   * @returns
   */
  public async resolveViaCache(contractAddress: string): Promise<string | null | undefined> {
    if (contractAddress && contractAddress !== "0x") {
      const contractName = await this.data.getNameByAddress(contractAddress);

      if (contractName) return contractName;

      // Try to resolve by deployedBytecode
      return this.resolveByDeployedBytecode(contractAddress);
    }
  }
}
