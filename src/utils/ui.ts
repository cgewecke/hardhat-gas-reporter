import chalk from "chalk";

const log = console.log;

/**
 * Message for un-parseable files
 * @param  {string} filePath
 * @param  {any} err
 * @return {void}
 */
export function warnParser(filePath: string, err: any) {
  log();
  log(chalk.red(`>>>>> WARNING <<<<<<`));
  log(
    `Failed to parse file: "${filePath}". No data will collected for its contract(s).`
  );
  log(
    `Please report the error below with the source that caused it to github.com/@solidityparser/parser`
  );
  log(chalk.red(`>>>>>>>>>>>>>>>>>>>>`));
  log(chalk.red(`${err}`));
  log();
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
