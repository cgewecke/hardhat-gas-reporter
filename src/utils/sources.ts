import fs from "fs";
import path from "path";
import parser from "@solidity-parser/parser";
import read from "fs-readdir-recursive";

import { SolcConfig } from "hardhat/types";
import { Config } from "../lib/config";
import { SolcInfo } from "../types";
import { warnParser } from "./ui";


/**
 * Load and read all solidity files
 * @param {string}          srcPath
 * @returns {string[]}      paths
 */
export function listSolidityFiles(srcPath: string): string[] {
  let base = `./${srcPath}/`;

  if (process.platform === "win32") {
    base = base.replace(/\\/g, "/");
  }

  const paths = read(base)
    .filter(file => path.extname(file) === ".sol")
    .map(file => base + file);

  return paths;
}

/**
 * Loads and parses Solidity files, returning a filtered array of contract names.
 * @param {Config} config         reporter config
 * @return {string[]} names       contract names
 */
export function parseSoliditySources(config: Config): string[] {
  const names: string[] = [];
  const files = listSolidityFiles(config.srcPath);
  files.forEach(file => {
    const namesForFile = getContractNames(file);
    const filtered = namesForFile.filter(
      name => !config.excludeContracts.includes(name)
    );
    filtered.forEach(item => names.push(item));
  });
  return names;
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
  const missing = "----";
  const info = {
    version: missing,
    optimizer: missing,
    runs: missing
  };
  if (solcConfig) {
    info.version = solcConfig.version;
    info.optimizer = solcConfig.settings.optimizer.enabled;
    info.runs = solcConfig.settings.optimizer.runs;
  }
  return info;
}

/**
 * Return true if transaction input and bytecode are same, ignoring library link code.
 * @param  {String} code
 * @param  {String} bytecode
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

/**
 * Parses files for contract names
 * @param  {String} filePath path to file
 * @return {String[]}        contract names
 */
export function getContractNames(filePath: string): string[] {
  const names: string[] = [];
  const code = fs.readFileSync(filePath, "utf-8");

  let ast;
  try {
    ast = parser.parse(code, { tolerant: true });
  } catch (err: any) {
    warnParser(filePath, err);
    return names;
  }

  parser.visit(ast, {
    ContractDefinition(node) {
      names.push(node.name);
    }
  });

  return names;
}
