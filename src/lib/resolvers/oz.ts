import { JsonRpcTx, CustomGasReporterResolver } from "../../types";
import { Resolver } from "./index";


/**
 * Custom resolver for OpenZeppelin's upgrades and defender plugins. There are two
 * types of upgrade for both systems, `erc1967` and `beacon`. They are queried in a
 * series for the missing contract's implementation address. This resolver gets attached
 * by default when `upgrades` or `defender` are present on the `hre` (as long as user
 * hasn't defined their own).
 *
 * Returns contract name matching the resolved address.
 * @param  {Resolver}                     `this`
 * @param  {JsonRpcTx} transaction        JSONRPC formatted transaction
 * @return {Promise<string | null>}       contract name
 */
export class OZResolver implements CustomGasReporterResolver {

  /**
   * OZ's `getImplementationAddress` and `getBeaconAddress` query a storage slot in the proxy
   * or beacon using `eth_getStorageAt`. There's no conflict with `eth_call`
   * https://github.com/OpenZeppelin/openzeppelin-upgrades/...
   * ...blob/5785b3f6b788c4c905e277486a7c1b45fd0ad45b/packages/core/src/provider.ts#L75C40-L75C56
   * @returns []
   */
  public ignore(): string[] {
    return [];
  }

  public async resolve(this: Resolver, transaction: JsonRpcTx): Promise<string | null> {
    let contractAddress;

    try {
      contractAddress = await (this.hre as any).upgrades.erc1967.getImplementationAddress(transaction.to!);
      const contractName = await this.resolveViaCache(contractAddress);
      if (contractName) return contractName;
    } catch(err) {}

    try {
      const beaconAddress = await (this.hre as any).upgrades.erc1967.getBeaconAddress(transaction.to!);
      contractAddress = await (this.hre as any).upgrades.beacon.getImplementationAddress(beaconAddress);
      const contractName = await this.resolveViaCache(contractAddress);
      if (contractName) return contractName;
    } catch(err) {}

    try {
      contractAddress = await (this.hre as any).defender.erc1967.getImplementationAddress(transaction.to!);
      const contractName = await this.resolveViaCache(contractAddress);
      if (contractName) return contractName;
    } catch(err) {}

    try {
      const beaconAddress = await (this.hre as any).defender.erc1967.getBeaconAddress(transaction.to!);
      contractAddress = await (this.hre as any).defender.beacon.getImplementationAddress(beaconAddress);
      const contractName = await this.resolveViaCache(contractAddress);
      if (contractName) return contractName;
    } catch(err) {}

    this.unresolvedCalls++;
    return null;
  }
}

