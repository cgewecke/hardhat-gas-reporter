import type { EthereumProvider, HardhatRuntimeEnvironment } from "hardhat/types";
import type {
  Deployment,
  GasReporterOptions,
  MethodData,
  ContractInfo,
  JsonRpcBlock,
  MethodDataItem
} from '../types';
import sha1 from "sha1";
import { FunctionFragment, Interface } from "@ethersproject/abi";

import { warnEthers } from "../utils/ui";
import { matchBinaries, getHashedFunctionSignature } from "../utils/sources";
import { gasToCost, gasToPercentOfLimit } from "../utils/gas";

type MethodID = { fnSig: string } & FunctionFragment;

/**
 * Data store written to by Collector and consumed by output formatters.
 */
export class GasData {
  public addressCache:{[hash: string]: string };
  public methods: MethodData;
  public deployments: Deployment[];
  public codeHashMap: {[hash: string]: string };
  public provider: EthereumProvider | undefined;

  constructor(methods?: MethodData, deployments?: Deployment[] ) {
    this.addressCache = {};
    this.methods = (methods) ? methods : {};
    this.deployments = (deployments) ? deployments : [];
    this.codeHashMap = {};
  }

  /**
   * Sets up data structures to store deployments and methods gas usage
   * @param {EthereumProvider}       provider
   * @param {ContractInfo[]}         contracts
   * @returns
   */
  public initialize(
    provider: EthereumProvider,
    contracts: ContractInfo[]
  ) {
    this.provider = provider;

    for (const item of contracts) {
      const contract = {
        name: item.name,
        bytecode: item.artifact.bytecode,
        deployedBytecode: item.artifact.deployedBytecode,
        gasData: [],
        callData: []
      };
      this.deployments.push(contract);

      if (item.artifact.bytecodeHash) {
        this.trackNameByPreloadedAddress(
          item.name,
          item.artifact.address!,
          item.artifact.bytecodeHash
        );
      }

      // Decode, getMethodIDs
      const methodIDs: {[hash: string]: MethodID } = {};

      let methods: { [name: string]: FunctionFragment; };
      try {
        methods = new Interface(item.artifact.abi).functions;
      } catch (err: any) {
        warnEthers(contract.name, err);
        return;
      }

      // Generate sighashes and remap ethers to something similar
      // to abiDecoder.getMethodIDs
      Object.keys(methods).forEach(key => {
        const sighash = getHashedFunctionSignature(key);
        // @ts-ignore
        methodIDs[sighash] = {fnSig: key, ...methods[key]};
      });

      // Create Method Map;
      Object.keys(methodIDs).forEach(key => {
        const isInterface = item.artifact.bytecode === "0x";
        const isCall = methodIDs[key].constant;
        const methodHasName = methodIDs[key].name !== undefined;
        const contractScopedKey = `${contract.name  }_${  key}`;

        if (methodHasName && !isInterface && !item.excludedMethods.includes(contractScopedKey)) {
          this.methods[contractScopedKey] = {
            key,
            isCall,
            contract: contract.name,
            method: methodIDs[key].name,
            fnSig: methodIDs[key].fnSig,
            intrinsicGas: [],
            callData: [],
            gasData: [],
            numberOfCalls: 0
          };
        }
      });
    }
  }

  /**
   * Calculate gas deltas compared to previous data, if applicable
   * @param  {GasData} previousData previous gas data
   */
  public addDeltas(previousData: GasData) {
    Object.keys(this.methods).forEach(key => {
      if (!previousData.methods[key]) return;

      const currentMethod = this.methods[key];
      const prevMethod = previousData.methods[key];

      this._calculateDeltas(prevMethod, currentMethod);
    });

    this.deployments.forEach((currentDeployment) => {
      const prevDeployment = previousData.deployments.find((d)=> d.name === currentDeployment.name);

      if (!prevDeployment) return;

      this._calculateDeltas(prevDeployment, currentDeployment);
    })
  }

  /**
   * Map a contract name to pre-generated hash of the code stored at an address
   * @param  {String} name    contract name
   * @param  {String} address contract address
   */
  public trackNameByPreloadedAddress(name: string, address: string, hash: string) {
    if (this.addressIsCached(address)) return;
    this.codeHashMap[hash] = name;
    this.addressCache[address] = name;
  }

  /**
   * Map a contract name to the sha1 hash of the code stored at an address
   * @param  {String} name    contract name
   * @param  {String} address contract address
   */
  public async trackNameByAddress(name: string, address: string): Promise<void> {
    if (this.addressIsCached(address)) return;

    const code = await this.provider!.send("eth_getCode", [address, "latest"]);
    const hash = code ? sha1(code) : null;

    this.addressCache[address] = name;

    if (hash !== null)
      this.codeHashMap[hash] = name;
  }

  /**
   * Get the name of the contract stored at contract address
   * @param  {string | null}                 contract address
   * @return {Promse<string | null>}         contract name
   */
  public async getNameByAddress(address: string | null): Promise<string | null> {
    if (!address) return null;

    if (this.addressIsCached(address)) {
      return this.addressCache[address!];
    }
    const code = await this.provider!.send("eth_getCode", [address, "latest"]);
    const hash = code ? sha1(code) : null;

    return (hash !== null) ? this.codeHashMap[hash] : null;
  }

  /**
   * Compares existing contract binaries to the input code for a
   * new deployment transaction and returns the relevant contract.
   * Ignores interfaces.
   * @param  {String}                  input tx.input
   * @return {Deployment | null}       this.deployments entry
   */
  public getContractByDeploymentInput(input: string): Deployment | null {
    if (!input) return null;

    const matches = this.deployments.filter(item =>
      matchBinaries(input, item.bytecode)
    );

    // Filter interfaces
    if (matches && (matches.length > 0)) {
      const match = matches.find(item => item.deployedBytecode !== "0x");
      return (match !== undefined) ? match : null;
    } else {
      return null;
    }
  }

  /**
   * Compares code at an address to the deployedBytecode for all
   * compiled contracts and returns the relevant item.
   * Ignores interfaces.
   * @param  {String} code         result of web3.eth.getCode
   * @return {Deployment | null}   this.deployments entry
   */
  public getContractByDeployedBytecode(code: string): Deployment | null {
    if (!code) return null;

    const matches = this.deployments.filter(item =>
      matchBinaries(code, item.deployedBytecode)
    );

    // Filter interfaces
    if (matches && (matches.length > 0)) {
      const match = matches.find(item => item.deployedBytecode !== "0x");
      return (match !== undefined) ? match : null;
    } else {
      return null;
    }
  }

  /**
   * Returns all contracts with a method matching the requested signature
   * @param  {String}   signature method signature hash
   * @return {MethodDataItem[]}           this.method entries array
   */
  public getAllContractsWithMethod(signature: string): MethodDataItem[] {
    return Object.values(this.methods).filter((el: any) => el.key === signature);
  }

  public addressIsCached(address: string | null): boolean {
    if (address === null) return false;
    return Object.keys(this.addressCache).includes(address);
  }

  public resetAddressCache() {
    this.addressCache = {};
  }

  /**
   * Calculates summary and price data for methods and deployments data after it's all
   * been collected
   */
  public async runAnalysis(hre: HardhatRuntimeEnvironment, options: GasReporterOptions) {
    const block = await hre.network.provider.send("eth_getBlockByNumber", ["latest", false]);
    const blockGasLimit = parseInt((block as JsonRpcBlock).gasLimit);

    let methodsExecutionTotal = 0;
    let methodsCalldataTotal = 0;
    let deploymentsExecutionTotal = 0;
    let deploymentsCalldataTotal = 0

    /* Methods */
    for (const key of Object.keys(this.methods)){
      const method = this.methods[key];

      if (method.gasData.length > 0) {
        this._processItemData(method, options);
        methodsExecutionTotal += method.executionGasAverage!;
        methodsCalldataTotal += method.calldataGasAverage!;
      }
    }

    /* Deployments */
    for (const deployment of this.deployments) {
      if (deployment.gasData.length !== 0) {
        this._processItemData(deployment, options)
        deployment.percent = gasToPercentOfLimit(deployment.executionGasAverage!, blockGasLimit);
        deploymentsExecutionTotal += deployment.executionGasAverage!;
        deploymentsCalldataTotal += deployment.calldataGasAverage!;
      }
    }

    hre.__hhgrec.blockGasLimit = blockGasLimit;
    hre.__hhgrec.methodsTotalGas = methodsExecutionTotal;
    hre.__hhgrec.deploymentsTotalGas = deploymentsExecutionTotal;
    hre.__hhgrec.methodsTotalCost = this._getCost(methodsExecutionTotal, methodsCalldataTotal, options);
    hre.__hhgrec.deploymentsTotalCost = this._getCost(deploymentsExecutionTotal, deploymentsCalldataTotal, options);
  }

  /**
   * Calculates execution and calldata gas averages, min/max and currency cost for method
   * and deployment data
   * @param {MethodDataItem | Deployment} item
   * @param {GasReporterOptions}          options
   */
  private _processItemData(item: MethodDataItem | Deployment, options: GasReporterOptions) {
    const executionTotal = item.gasData.reduce((acc: number, datum: number) => acc + datum, 0);
    item.executionGasAverage = Math.round(executionTotal / item.gasData.length);

    const calldataTotal = item.callData.reduce((acc: number, datum: number) => acc + datum, 0);
    item.calldataGasAverage = Math.round(calldataTotal / item.gasData.length);
    item.cost = this._getCost(item.executionGasAverage, item.calldataGasAverage, options);

    const sortedData = item.gasData.sort((a: number, b: number) => a - b);
    item.min = sortedData[0];
    item.max = sortedData[sortedData.length - 1];
  }

  /**
   * Optionally calculates the total currency cost of execution and calldata gas usage
   * @param {number}             executionGas
   * @param {number}             calldataGas
   * @param {GasReporterOptions} options
   * @returns
   */
  private _getCost(
    executionGas: number,
    calldataGas: number,
    options: GasReporterOptions
  ): string | undefined {

    return (options.tokenPrice && options.gasPrice)
        ? gasToCost(
            executionGas,
            calldataGas,
            options
          )
        : undefined;
  }

  /**
   * Calculate gas deltas for a given method or deployment item
   * @param  {MethodDataItem | Deployment} prev
   * @param  {MethodDataItem | Deployment} current
   */
  private _calculateDeltas(prev: MethodDataItem | Deployment, current: MethodDataItem | Deployment) {
    if (current.min !== undefined && prev.min !== undefined) {
      current.minDelta = current.min! - prev.min!;
    }

    if (current.max !== undefined && prev.max !== undefined) {
      current.maxDelta = current.max! - prev.max!;
    }

    if (current.executionGasAverage !== undefined && prev.executionGasAverage !== undefined) {
      current.executionGasAverageDelta = current.executionGasAverage! - prev.executionGasAverage!;
    }

    if (current.calldataGasAverage !== undefined && prev.calldataGasAverage !== undefined) {
      current.calldataGasAverageDelta = current.calldataGasAverage! - prev.calldataGasAverage!;
    }
  }
}
