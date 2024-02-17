import chalk from "chalk";

import _ from "lodash";
import fs from "fs";
import Table, { HorizontalTableRow } from "cli-table3";
import { utils } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSolcInfo } from "../utils/sources";

import { GasReporterOptions, MethodDataItem } from "../types";
import { GasData } from "./gasData";


export class GasDetailsTextTable {

  /**
   * Formats and prints a gas statistics table. Optionally writes to a file.
   * Based on Alan Lu's (github.com/cag) stats for Gnosis
   * @param  {Object} data   GasData instance with `methods` and `deployments` data
   */
  public generate(hre: HardhatRuntimeEnvironment, data: GasData, options: GasReporterOptions) {
    if (options.noColors || options.outputFile !== undefined) {
      chalk.level = 0;
    } else {
      chalk.level = 1;
    }
    // ---------------------------------------------------------------------------------------------
    // Assemble section: methods
    // ---------------------------------------------------------------------------------------------
    const methodRows: any[] = [];

    _.forEach(data.methods, (method: MethodDataItem) => {
      if (!method) return;

      const stats: any = {};

      if (method.gasData.length > 0) {
        stats.average = utils.commify(method.average!);
        stats.cost = (method.cost === undefined) ? chalk.grey("-") : method.cost;
      } else {
        stats.average = chalk.grey("-");
        stats.cost = chalk.grey("-");
      }

      if (method.min && method.max) {
        const uniform = (method.min === method.max);
        stats.min = uniform ? chalk.grey("-") : chalk.cyan(utils.commify(method.min!));
        stats.max = uniform ? chalk.grey("-") : chalk.red(utils.commify(method.max!));
      }

      stats.numberOfCalls = chalk.cyan(method.numberOfCalls.toString());

      const fnName = options.showMethodSig ? method.fnSig : method.method;

      if (!options.onlyCalledMethods || method.numberOfCalls > 0) {
        const section: any = [];
        section.push(chalk.cyan.bold(method.contract));
        section.push(fnName);
        section.push({ hAlign: "right", content: stats.min });
        section.push({ hAlign: "right", content: stats.max });
        section.push({ hAlign: "right", content: stats.average });
        section.push({ hAlign: "right", content: stats.numberOfCalls });
        section.push({
          hAlign: "right",
          content: chalk.green(stats.cost.toString())
        });

        methodRows.push(section);
      }
    });

    // ---------------------------------------------------------------------------------------------
    // Assemble section: deployments
    // ---------------------------------------------------------------------------------------------
    const deployRows: any = [];
    // Alphabetize contract names
    data.deployments.sort((a, b) => a.name.localeCompare(b.name));

    data.deployments.forEach(deployment => {
      const stats: any = {};
      if (deployment.gasData.length === 0) return;

      stats.cost = (deployment.cost === undefined) ? chalk.grey("-") : deployment.cost;

      if (deployment.min && deployment.max) {
        const uniform = deployment.min === deployment.max;
        stats.min = uniform ? chalk.grey("-") : chalk.cyan(utils.commify(deployment.min!));
        stats.max = uniform ? chalk.grey("-") : chalk.red(utils.commify(deployment.max!));
      }

      const section = [];
      section.push({ hAlign: "left", colSpan: 2, content: deployment.name });
      section.push({ hAlign: "right", content: stats.min });
      section.push({ hAlign: "right", content: stats.max });
      section.push({ hAlign: "right", content: utils.commify(deployment.average!) });
      section.push({
        hAlign: "right",
        content: chalk.cyan(`${deployment.percent!} %`)
      });
      section.push({
        hAlign: "right",
        content: chalk.green(stats.cost.toString())
      });

      deployRows.push(section);
    });

    // ---------------------------------------------------------------------------------------------
    // Assemble section: headers
    // ---------------------------------------------------------------------------------------------

    // Configure indentation for RTD
    const leftPad = options.rst ? "  " : "";

    // Format table
    const table = new Table({
      style: { head: [], border: [], "padding-left": 2, "padding-right": 2 },
      chars: {
        mid: "·",
        "top-mid": "|",
        "left-mid": `${leftPad}·`,
        "mid-mid": "|",
        "right-mid": "·",
        left: `${leftPad}|`,
        "top-left": `${leftPad}·`,
        "top-right": "·",
        "bottom-left": `${leftPad}·`,
        "bottom-right": "·",
        middle: "·",
        top: "-",
        bottom: "-",
        "bottom-mid": "|"
      }
    });

    const solc = getSolcInfo(hre.config.solidity.compilers[0]);

    // Format and load methods metrics
    const title = [
      {
        hAlign: "center",
        colSpan: 2,
        content: chalk.cyan.bold(`Solc version: ${solc.version}`)
      },
      {
        hAlign: "center",
        colSpan: 2,
        content: chalk.cyan.bold(`Optimizer enabled: ${solc.optimizer}`)
      },
      {
        hAlign: "center",
        colSpan: 1,
        content: chalk.cyan.bold(`Runs: ${solc.runs}`)
      },
      {
        hAlign: "center",
        colSpan: 2,
        content: chalk.cyan.bold(`Block limit: ${utils.commify(hre.__hhgrec.blockGasLimit!)} gas`)
      }
    ];

    let methodSubtitle;
    if (options.ethPrice && options.gasPrice) {
      const gwei = options.gasPrice;
      const rate = parseFloat(options.ethPrice.toString()).toFixed(2);
      const currency = `${options.currency!.toLowerCase()}`;
      const token = `${options.token!.toLowerCase()}`;

      methodSubtitle = [
        { hAlign: "left", colSpan: 2, content: chalk.green.bold("Methods") },
        {
          hAlign: "center",
          colSpan: 3,
          content: chalk.cyan.bold(`${gwei} gwei/gas`)
        },
        {
          hAlign: "center",
          colSpan: 2,
          content: chalk.red.bold(`${rate} ${currency}/${token}`)
        }
      ];
    } else {
      methodSubtitle = [
        { hAlign: "left", colSpan: 7, content: chalk.green.bold("Methods") }
      ];
    }

    const header = [
      chalk.bold("Contract"),
      chalk.bold("Method"),
      chalk.green("Min"),
      chalk.green("Max"),
      chalk.green("Avg"),
      chalk.bold("# calls"),
      chalk.bold(`${options.currency!.toLowerCase()} (avg)`)
    ];

    // ---------------------------------------------------------------------------------------------
    // Final assembly
    // ---------------------------------------------------------------------------------------------
    table.push(title as HorizontalTableRow);
    table.push(methodSubtitle as HorizontalTableRow);
    table.push(header);

    methodRows.sort((a, b) => {
      const contractName = a[0].localeCompare(b[0]);
      const methodName = a[1].localeCompare(b[1]);
      return contractName || methodName;
    });

    methodRows.forEach(row => table.push(row));

    if (deployRows.length) {
      const deploymentsSubtitle = [
        {
          hAlign: "left",
          colSpan: 2,
          content: chalk.green.bold("Deployments")
        },
        { hAlign: "right", colSpan: 3, content: "" },
        { hAlign: "left", colSpan: 1, content: chalk.bold(`% of limit`) }
      ];
      table.push(deploymentsSubtitle as HorizontalTableRow);
      deployRows.forEach((row: any) => table.push(row));
    }

    // ---------------------------------------------------------------------------------------------
    // RST / ReadTheDocs / Sphinx output
    // ---------------------------------------------------------------------------------------------
    let rstOutput = "";
    if (options.rst) {
      rstOutput += `${options.rstTitle!}\n`;
      rstOutput += `${"=".repeat(options.rstTitle!.length)}\n\n`;
      rstOutput += `.. code-block:: shell\n\n`;
    }

    const tableOutput = rstOutput + table.toString();

    // ---------------------------------------------------------------------------------------------
    // Print
    // ---------------------------------------------------------------------------------------------
    if (options.outputFile) {
      fs.writeFileSync(options.outputFile, tableOutput);
    } else {
      console.log(tableOutput);
    }

    // TODO: this is broken - unserializable BigInt
    // this.writeJSON(data, options);
  }

  /**
   * Writes acccumulated data and the current options to gasReporterOutput.json so it
   * can be consumed by codechecks
   * @param  {Object} data  GasData instance
   */
  public writeJSON(data: GasData, options: GasReporterOptions) {
    const output = {
      namespace: "hardhatGasReporter",
      options,
      data
    };

    if (process.env.CI) {
      fs.writeFileSync("./gasReporterOutput.json", JSON.stringify(output));
    }
  }
}
