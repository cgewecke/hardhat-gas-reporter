import { SolcConfig } from "hardhat/types";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, bytesToHex } from "ethereum-cryptography/utils";
import { SolcInfo } from "../types";


/**
 * Generates hashed function selector from the human readable function signature
 * @param {string} fnSig
 * @returns
 */
export function getHashedFunctionSignature(fnSig: string ): string {
  return bytesToHex(keccak256(Buffer.from(utf8ToBytes(fnSig)))).slice(0, 8);
}

/**
 * Generates id for a GasData.methods entry from the input of a web3.eth.getTransaction
 * and a contract name
 * @param  {String} contractName
 * @param  {String} code             hex data
 * @return {String}                  id
 */
export function getMethodID(contractName: string, code: string): string {
  return `${contractName  }_${  code.slice(2, 10)}`;
}

/**
 * Extracts solc settings and version info from solidity metadata
 * @param  {Object} solcConfig solidity config
 * @return {Object}          {version, optimizer, runs}
 */
export function getSolcInfo(solcConfig: SolcConfig): SolcInfo {
  const info: any = {};
  const optimizer = solcConfig.settings.optimizer;
  const viaIR = solcConfig.settings.viaIR

  if (solcConfig) {
    info.version = solcConfig.version;
    info.optimizer = (optimizer) ? optimizer.enabled : "----"
    info.runs = (optimizer) ? optimizer.runs : "----"
    info.viaIR = (viaIR !== undefined) ? viaIR : false;
  }
  return info;
}

/**
 * Return true if transaction input and bytecode are same, ignoring library link code.
 * @param  {String} input       contract creation tx `input`
 * @param  {String} bytecode    contract bytecode
 * @return {Bool}
 */
export function matchBinaries(input: string, bytecode: string): boolean {
  const regExp = bytecodeToBytecodeRegex(bytecode);
  return input.match(regExp) !== null;
}

/**
 * Generate a regular expression string which is library link agnostic so we can match
 * linked bytecode deployment transaction inputs to the evm.bytecode solc output.
 * @param  {String} bytecode
 * @return {String}
 */
export function bytecodeToBytecodeRegex(bytecode = ""): string {
  const bytecodeRegex = bytecode
    .replace(/__.{38}/g, ".{40}")
    .replace(/73f{40}/g, ".{42}");

  // HACK: Node regexes can't be longer that 32767 characters.
  // Contracts bytecode can. We just truncate the regexes. It's safe in practice.
  const MAX_REGEX_LENGTH = 32767;
  const truncatedBytecodeRegex = bytecodeRegex.slice(0, MAX_REGEX_LENGTH);
  return truncatedBytecodeRegex;
}
