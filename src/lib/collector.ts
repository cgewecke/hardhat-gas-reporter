import type { RpcReceiptOutput } from "hardhat/internal/hardhat-network/provider/output"
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GasReporterOptions, JsonRpcTx } from "../types"
import { getCalldataGasForNetwork, hexToDecimal } from "../utils/gas";
import { getMethodID } from "../utils/sources";
import { GasData } from "./gasData";

import { Resolver } from "./resolvers/index";

/**
 * Collects gas usage data, associating it with the relevant contracts, methods.
 */
export class Collector {
  public data: GasData;
  public options: GasReporterOptions;
  public resolver: Resolver;

  constructor(hre: HardhatRuntimeEnvironment, options: GasReporterOptions) {
    this.data = new GasData();
    this.options = options;
    this.resolver = new Resolver(hre, options, this.data);
  }

  /**
   * Method called by the request monitor on the provider to collect deployment
   * and methods gas data
   * @param {JsonRpcTx} transaction [description]
   * @param {TransactionReceipt} receipt     [description]
   */
  public async collectTransaction(tx: JsonRpcTx, receipt: RpcReceiptOutput): Promise<void> {
    if (receipt.contractAddress !== null)
      await this._collectDeploymentsData(tx, receipt);
    else
      await this._collectMethodsData(tx, receipt);
  }

  /**
   * Extracts and stores deployments gas usage data for a tx
   * @param  {JsonRpcTx} transaction return value of `getTransactionByHash`
   * @param  {TransactionReceipt} receipt
   */
  private async _collectDeploymentsData(tx: JsonRpcTx, receipt: RpcReceiptOutput): Promise<void> {
    const match = this.data.getContractByDeploymentInput(tx.input!);

    if (match !== null) {
      await this.data.trackNameByAddress(
        match.name,
        receipt.contractAddress!
      );

      const executionGas = hexToDecimal(receipt.gasUsed);
      const calldataGas = getCalldataGasForNetwork(this.options, tx);

      match.gasData.push(executionGas);
      match.callData.push(calldataGas);
    }
  }

  /**
   * Extracts and stores methods gas usage data for a tx
   * @param  {JsonRpcTx} transaction return value of `getTransactionByHash`
   * @param  {TransactionReceipt} receipt
   */
  private async _collectMethodsData(tx: JsonRpcTx, receipt: RpcReceiptOutput ): Promise<void> {
    let contractName = await this.data.getNameByAddress(tx.to);

    // Case: proxied call
    if (this._isProxied(contractName, tx.input!)) {
      contractName = await this.resolver.resolveByProxy(tx);
      // Case: hidden contract factory deployment
    } else if (contractName === null) {
      contractName = await this.resolver.resolveByDeployedBytecode(
        tx.to
      );
    }

    // Case: all else fails, use first match strategy
    if (contractName === null) {
      contractName = this.resolver.resolveByMethodSignature(tx);
    }

    const id = getMethodID(contractName!, tx.input!);

    if (this.data.methods[id] !== undefined) {
      const executionGas = hexToDecimal(receipt.gasUsed);
      const calldataGas = getCalldataGasForNetwork(this.options, tx);

      this.data.methods[id].gasData.push(executionGas);
      this.data.methods[id].callData.push(calldataGas);
      this.data.methods[id].numberOfCalls += 1;
    } else {
      this.resolver.unresolvedCalls++;
    }
  }

  /**
   * Returns true if there is a contract name associated with an address
   * but method can't be matched to it
   * @param  {String}  name  contract name
   * @param  {String}  input code
   * @return {Boolean}
   */
  private _isProxied(name: string | null, input: string): boolean {
    if (name !== null) {
      return (this.data.methods[getMethodID(name, input)] === undefined)
    }
    return false;
  }
}
