import { JsonRpcTx } from "../../types";
import { Resolver } from "./index";

/**
 * Custom resolver for OpenZeppelin's upgrades and defender plugins. There are two
 * types of upgrade for both systems, `erc1967` and `beacon`. They are queried in a
 * series for the missing contract's implementation address. Resolver is attached
 * when `upgrades` or `defender` are list
 *
 * Returns contract name matching the resolved address.
 * @param  {Resolver}                     `this`
 * @param  {JsonRpcTx} transaction        JSONRPC formatted transaction
 * @return {Promise<string | null>}       contract name
 */
export async function customResolver(this: Resolver, transaction: JsonRpcTx): Promise<string | null> {
  let contractAddress;

  try {
    contractAddress = await (this.hre as any).upgrades.erc1967.getImplementationAddress(transaction.to!);
    const contractName = await matchToAddress(this, contractAddress);
    if (contractName) return contractName;
  } catch(err) {}

  try {
    const beaconAddress = await (this.hre as any).upgrades.erc1967.getBeaconAddress(transaction.to!);
    contractAddress = await (this.hre as any).upgrades.beacon.getImplementationAddress(beaconAddress);
    const contractName = await matchToAddress(this, contractAddress);
    if (contractName) return contractName;
  } catch(err) {}

  try {
    contractAddress = await (this.hre as any).defender.erc1967.getImplementationAddress(transaction.to!);
    const contractName = await matchToAddress(this, contractAddress);
    if (contractName) return contractName;
  } catch(err) {}

  try {
    const beaconAddress = await (this.hre as any).defender.erc1967.getBeaconAddress(transaction.to!);
    contractAddress = await (this.hre as any).defender.beacon.getImplementationAddress(beaconAddress);
    const contractName = await matchToAddress(this, contractAddress);
    if (contractName) return contractName;
  } catch(err) {}

  this.unresolvedCalls++;
  return null;
}

async function matchToAddress(
  resolver: Resolver,
  contractAddress: string
): Promise<string | null | undefined> {
  if (contractAddress && contractAddress !== "0x") {
    const contractName = await resolver.data.getNameByAddress(contractAddress);

    if (contractName) return contractName;

    // Try to resolve by deployedBytecode
    return resolver.resolveByDeployedBytecode(contractAddress);
  }
}

