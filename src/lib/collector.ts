import type { RpcReceiptOutput } from "hardhat/internal/hardhat-network/provider/output"
import { hexlify } from "@ethersproject/bytes";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getMethodID } from "../utils/sources";
import {
  getCalldataGasForNetwork,
  hexToDecimal,
  getIntrinsicGas,
  getGasSubIntrinsic
} from "../utils/gas";
import { GasReporterOptions, JsonRpcTx, FakeTx, ValidatedRequestArguments } from "../types"
import { GasData } from "./gasData";
import { Resolver } from "./resolvers";


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
      await this._collectMethodsData(tx, receipt, false);
  }

  /**
   * Method called by the request monitor on the provider to get gas data for `eth_call`
   * @param {ValidatedRequestArguments}    params.args  of the call
   * @param {number}                       estimate_gas result
   */
  public async collectCall(args: ValidatedRequestArguments, gas: number): Promise<void> {
    const callGas = gas - getIntrinsicGas(args.params[0].data);
    const fakeTx = {
      input: args.params[0].data,
      to: args.params[0].to,
      isCall: true
    }

    const fakeReceipt = {
      gasUsed: hexlify(callGas)
    }

    await this._collectMethodsData(
      fakeTx as FakeTx,
      fakeReceipt as unknown as RpcReceiptOutput,
      true
    );
  }

  /**
   * Extracts and stores deployments gas usage data for a tx
   * @param  {JsonRpcTx}          tx       return value of `getTransactionByHash`
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
   * @param  {JsonRpcTx}          transaction return value of `getTransactionByHash`
   * @param  {TransactionReceipt} receipt
   * @param  {boolean}            isCall
   */
  private async _collectMethodsData(
    tx: JsonRpcTx | FakeTx,
    receipt: RpcReceiptOutput,
    isCall: boolean
  ): Promise<void> {
    let contractName = await this.data.getNameByAddress(tx.to);

    // Case: proxied call
    if (this._isProxied(contractName, tx.input!)) {
      contractName = await this.resolver.resolveByProxy(tx);
    }

    // Case: hidden contract factory deployment
    if (contractName === null) {
      contractName = await this.resolver.resolveByDeployedBytecode(
        tx.to
      );
    }

    // Case: all else fails, use first match strategy
    if (contractName === null) {
      contractName = this.resolver.resolveByMethodSignature(tx as JsonRpcTx);
    }

    const id = getMethodID(contractName!, tx.input!);

    if (this.data.methods[id] !== undefined) {
      const executionGas = (this.options.includeIntrinsicGas)
        ? hexToDecimal(receipt.gasUsed)
        : getGasSubIntrinsic(tx.input, hexToDecimal(receipt.gasUsed));

      // If L2 txs have intrinsic turned off, we assume caller
      // is paying the L1 overhead
      const calldataGas = (isCall || !this.options.includeIntrinsicGas)
        ? 0
        : getCalldataGasForNetwork(this.options, tx as JsonRpcTx);

      const intrinsicGas = getIntrinsicGas(tx.input);

      this.data.methods[id].gasData.push(executionGas);
      this.data.methods[id].callData.push(calldataGas);
      this.data.methods[id].intrinsicGas.push(intrinsicGas);
      this.data.methods[id].numberOfCalls += 1;
      this.data.methods[id].isCall = this.data.methods[id].isCall || !this.options.includeIntrinsicGas;
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
