import type { Artifacts } from "hardhat/types";
import type { EGRAsyncApiProvider } from './providers';
import type { FunctionFragment } from 'ethers/lib/utils';
import type { Config } from './config';
import type { Deployment, MethodData, RemoteContract } from '../types';
import ethers from "ethers";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, bytesToHex } from "ethereum-cryptography/utils";
import sha1 from "sha1";

import { warnEthers } from "../utils/ui";
import { matchBinaries } from "../utils/sources";

import { getContracts } from "./artifacts";

type MethodID = { fnSig: string } & FunctionFragment;

/**
 * Data store written to by Collector and consumed by output formatters.
 */
export class GasData {
  public addressCache:{[hash: string]: string };
  public methods: MethodData;
  public deployments: Deployment[];
  public codeHashMap: {[hash: string]: string };
  public provider: EGRAsyncApiProvider | undefined;

  constructor() {
    this.addressCache = {};
    this.methods = {};
    this.deployments = [];
    this.codeHashMap = {};
  }

  /**
   * Sets up data structures to store deployments and methods gas usage
   * @param config {Config}
   * @param provider {EGRAsyncApiProvider}
   * @param artifacts {Artifacts}
   * @param skippable {string[]}
   * @param remoteContracts {RemoteContracts[]}
   * @param qualifiedNames {string[]}
   * @returns
   */
  public initialize(
    config: Config,
    provider: EGRAsyncApiProvider,
    artifacts: Artifacts,
    skippable: string[],
    remoteContracts: RemoteContract[],
    qualifiedNames: string[]
  ) {

    this.provider = provider;

    for (const contract of getContracts(artifacts, skippable, remoteContracts, qualifiedNames)) {
      const contractInfo = {
        name: contract.name,
        bytecode: contract.artifact.bytecode,
        deployedBytecode: contract.artifact.deployedBytecode,
        gasData: []
      };
      this.deployments.push(contractInfo);

      if (contract.artifact.bytecodeHash) {
        this.trackNameByPreloadedAddress(
          contract.name,
          contract.artifact.address!,
          contract.artifact.bytecodeHash
        );
      }

      // Decode, getMethodIDs
      const methodIDs: {[hash: string]: MethodID } = {};

      let methods: { [name: string]: FunctionFragment; };
      try {
        methods = new ethers.utils.Interface(contract.artifact.abi).functions;
      } catch (err: any) {
        warnEthers(contract.name, err);
        return;
      }

      // Generate sighashes and remap ethers to something similar
      // to abiDecoder.getMethodIDs
      Object.keys(methods).forEach(key => {
        const sighash = bytesToHex(keccak256(Buffer.from(utf8ToBytes(key))).slice(0, 8));
        // @ts-ignore
        methodIDs[sighash] = {fnSig: key, ...methods[key]};
      });

      // Create Method Map;
      Object.keys(methodIDs).forEach(key => {
        const isInterface = contract.artifact.bytecode === "0x";
        const isCall = methodIDs[key].type === "call";
        const methodHasName = methodIDs[key].name !== undefined;

        if (methodHasName && !isCall && !isInterface) {
          this.methods[`${contract.name  }_${  key}`] = {
            key,
            contract: contract.name,
            method: methodIDs[key].name,
            fnSig: methodIDs[key].fnSig,
            gasData: [],
            numberOfCalls: 0
          };
        }
      });
    }
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

    const code = await this.provider!.getCode(address);
    const hash = code ? sha1(code) : null;

    this.addressCache[address] = name;

    if (hash !== null)
      this.codeHashMap[hash] = name;
  }

  /**
   * Get the name of the contract stored at contract address
   * @param  {String | null} address contract address
   * @return {String}         contract name
   */
  public async getNameByAddress(address: string | null): Promise<string | null> {
    if (!address) return null;

    if (this.addressIsCached(address)) {
      return this.addressCache[address!];
    }
    const code = await this.provider!.getCode(address);
    const hash = code ? sha1(code) : null;

    return (hash !== null) ? this.codeHashMap[hash] : null;
  }

  /**
   * Compares existing contract binaries to the input code for a
   * new deployment transaction and returns the relevant contract.
   * Ignores interfaces.
   * @param  {String} input tx.input
   * @return {Object}       this.deployments entry
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
   * @param  {String} code  result of web3.eth.getCode
   * @return {Object}       this.deployments entry
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
   * @return {Object[]}           this.method entries array
   */
  public getAllContractsWithMethod(signature: string) {
    return Object.values(this.methods).filter((el: any) => el.key === signature);
  }

  public addressIsCached(address: string | null) {
    if (address === null) return false;
    return Object.keys(this.addressCache).includes(address);
  }

  public resetAddressCache() {
    this.addressCache = {};
  }
}