import chalk from "chalk";
import { TABLE_NAME_LEGACY, TABLE_NAME_MARKDOWN, TABLE_NAME_TERMINAL } from "../constants";

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
