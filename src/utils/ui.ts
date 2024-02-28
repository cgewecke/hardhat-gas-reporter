import chalk from "chalk";
import {
  DEFAULT_GAS_PRICE_PRECISION,
  TABLE_NAME_LEGACY,
  TABLE_NAME_MARKDOWN,
  TABLE_NAME_TERMINAL
} from "../constants";
import { GasReporterOptions } from "../types";

const log = console.log;

export function indentText(val: string) {
  return `    ${val}`;
}

export function indentMarkdown(val: string) {
  return `       *${val}*`;
}

export function entitleMarkdown(val: string) {
  return `**${val}**`;
}

export function getSmallestPrecisionVal(precision: number): number {
  let start = "."
  for (let i = 0; i < precision - 1; i++ ) {
    start += "0";
  }
  start += "1";
  return parseFloat(start);
}

/**
 * Message for un-parseable ABI (ethers)
 * @param  {string} name contract name
 * @param  {any} err
 * @return {void}
 */
export function warnEthers(name: string, err: any) {
  log();
  log(chalk.red(`>>>>> WARNING <<<<<<`));
  log(
    `Failed to parse ABI for contract: "${name}". (Its method data will not be collected).`
  );
  log(`Please report the error below with the source that caused it to github.com/ethers-io/ethers.js`);
  log(chalk.red(`>>>>>>>>>>>>>>>>>>>>`));
  log(chalk.red(`${err}`));
  log();
}

/**
 * Message invalid report formats
 * @param  {string} name report format
 * @return {void}
 */
export function warnReportFormat(name: string | undefined) {
  log();
  log(chalk.red(`>>>>> WARNING <<<<<<`));
  log(
    `Failed to generate gas report for format: "${name!}". The available formats are: `
  );
  log(`> "${TABLE_NAME_TERMINAL}"`);
  log(`> "${TABLE_NAME_MARKDOWN}"`);
  log(`> "${TABLE_NAME_LEGACY}"`);
  log(chalk.red(`>>>>>>>>>>>>>>>>>>>>`));
  log();
}

/**
 * Message for `--parallel` disabling gas reporter
 * @return {void}
 */
export function warnParallel() {
  log();
  log(chalk.red(`>>>>> WARNING <<<<<<`));
  log(
    "Gas reporting has been skipped because plugin `hardhat-gas-reporter` " +
    "does not support the --parallel flag."
  );
  log(chalk.red(`>>>>>>>>>>>>>>>>>>>>`));
  log();
}

/**
 * Gets L1 / L2 variables shared between tables
 * @param options
 * @returns
 */
export function getCommonTableVals(options: GasReporterOptions) {
  const usingL1 = options.L2 === undefined;

  let l1gwei: string | number = (usingL1) ? options.gasPrice!: options.baseFee!;
  let l2gwei: string | number = (usingL1) ? "" : options.gasPrice!;
  const l1gweiNote: string = (usingL1) ? "" : "(baseFee)";
  const l2gweiNote: string = (usingL1) ? "" : "(gasPrice)";
  const network = (usingL1) ? "L1 EVM" : `${options.L2!}`

  const rate = (options.tokenPrice)
    ? parseFloat(options.tokenPrice.toString()).toFixed(2)
    : "-";

  const currency = (options.currency)
    ? `${options.currency!.toLowerCase()}`
    : "-";

  // Token has a default value
  const token = `${options.token!.toLowerCase()}`;

  // Truncate subzero gas prices to 5 decimal precision
  if (typeof l1gwei === "number" && l1gwei < 1) {
    l1gwei = parseFloat(l1gwei.toString()).toFixed(DEFAULT_GAS_PRICE_PRECISION);
  }

  if (typeof l2gwei === "number" && l2gwei < 1) {
    l2gwei = parseFloat(l2gwei.toString()).toFixed(DEFAULT_GAS_PRICE_PRECISION);
  }

  const nonZeroMsg = "Cost was non-zero but below the precision setting for the currency display";
  const intrinsicMsg = "Execution gas for this method does not include intrinsic gas overhead ";

  return {
    l1gwei,
    l2gwei,
    l1gweiNote,
    l2gweiNote,
    network,
    rate,
    currency,
    token,
    nonZeroMsg,
    intrinsicMsg
  }
}
