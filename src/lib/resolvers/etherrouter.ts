import { Interface } from "@ethersproject/abi";
import { hexStripZeros } from "@ethersproject/bytes";

import { getHashedFunctionSignature } from "../../utils/sources";
import { CustomGasReporterResolver, JsonRpcTx } from "../../types";
import { Resolver } from "./index";


const ABI = ["function resolver()", "function lookup(bytes4 sig)"];

/**
 * Example of a class that resolves the contract names of method calls routed through
 * a simple proxy (EtherRouter-style) contract. At runtime, the function below will be bound to
 * the `this` property of plugin's Resolver class and inherit its resources which include:
 *
 * > helpers to match methods to contracts (e.g all public methods on the Resolver & GasData classes)
 * > the HardhatRuntimeEnvironment (so you can access all env extensions and the network provider.)
 *
 * The method receives a JSONRPC formatted transaction object representing a tx
 * the reporter could not deterministically associate with any contract. It relies on your
 * knowledge of a proxy contract's API to derive the correct contract name.
 *
 * Returns contract name matching the resolved address.
 * @param  {Object} transaction JSONRPC formatted transaction
 * @return {String}             contract name
 */
export class EtherRouterResolver implements CustomGasReporterResolver {
  /**
   * Because the gas reporter tracks `eth_calls` made with the provider, the class
   * needs to declare the function signatures it uses to retrieve the identity of proxied
   * targets on-chain. If these aren't filtered by the GasReporterProvider it gets
   * trapped in an infinite loop.
   */
  public ignore(): string[] {
    const functions = new Interface(ABI).functions
    const signatures = Object.keys(functions)
    return [
      getHashedFunctionSignature(signatures[0]),
      getHashedFunctionSignature(signatures[1])
    ];
  }

  public async resolve(this: Resolver, transaction: JsonRpcTx): Promise<string | null> {
    let contractAddress;
    let contractName;

    try {
      const iface = new Interface(ABI);

      // The tx passed to this method had input data which didn't map to any methods on
      // the contract it was sent to. We know the tx's `to` address might point to
      // a router contract which forward calls so we grab the method signature and ask
      // the router if it knows who the intended recipient is.
      const signature = transaction.input.slice(0, 10);

      // The router has a public state variable called `resolver()` which stores the
      // address of a contract which maps method signatures to their parent contracts.
      const resolverAddress = await this.hre.network.provider.send("eth_call", [{
          to: transaction.to!,
          data: iface.encodeFunctionData("resolver()", [])
      }]);

      // Now we'll call the EtherRouterResolver contract's `lookup(sig)` method to get
      // the address of the contract our tx was actually getting forwarded to.
      contractAddress = await this.hre.network.provider.send("eth_call",[
        {
          to: hexStripZeros(resolverAddress),
          data: iface.encodeFunctionData("lookup(bytes4)", [signature])
        }
      ]);

      contractAddress = hexStripZeros(contractAddress);

    // Don't forget this is all speculative...
    } catch (err) {
      this.unresolvedCalls++;
      return null;
    }

    // With the correct address, we can use the reporter's Resolver class methods
    // `data.getNameByAddress` and/or `resolveByDeployedBytecode` to derive
    // the target contract's name.
    if (contractAddress && contractAddress !== "0x") {
      contractName = await this.data.getNameByAddress(contractAddress);

      // Try to resolve by deployedBytecode
      if (contractName) return contractName;
      else return this.resolveByDeployedBytecode(contractAddress);
    }

    return null;
  }
}
