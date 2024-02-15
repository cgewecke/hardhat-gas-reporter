import Chalk, { ChalkInstance } from "chalk";

import _ from "lodash";
import fs from "fs";
import Table, { HorizontalTableRow } from "cli-table3";

import { gasToCost, gasToPercentOfLimit } from "../utils/gas";
import { getSolcInfo } from "../utils/sources";

import { MethodDataItem } from "../types";
import {Config} from './config';
import { GasData } from "./gasData";

export class GasTable {
  public config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Formats and prints a gas statistics table. Optionally writes to a file.
   * Based on Alan Lu's (github.com/@cag) stats for Gnosis
   * @param  {Object} data   GasData instance with `methods` and `deployments` data
   */
  public async generate(data: GasData) {
    let chalk: ChalkInstance;
    if (this.config.noColors)
      chalk = new (Chalk as any)({level: 0});
    else
      chalk = new (Chalk as any)({level: 1});

    // ---------------------------------------------------------------------------------------------
    // Assemble section: methods
    // ---------------------------------------------------------------------------------------------
    const methodRows: any[] = [];

    _.forEach(data.methods, (method: MethodDataItem) => {
      if (!method) return;

      const stats: any = {};

      if (method.gasData.length > 0) {
        const total = method.gasData.reduce((acc: number, datum: number) => acc + datum, 0);
        stats.average = Math.round(total / method.gasData.length);

        stats.cost =
          this.config.ethPrice && this.config.gasPrice
            ? gasToCost(
                stats.average,
                this.config.ethPrice,
                this.config.gasPrice
              )
            : chalk.grey("-");
      } else {
        stats.average = chalk.grey("-");
        stats.cost = chalk.grey("-");
      }

      const sortedData = method.gasData.sort((a: number, b: number) => a - b);
      stats.min = sortedData[0];
      stats.max = sortedData[sortedData.length - 1];

      const uniform = stats.min === stats.max;
      stats.min = uniform ? "-" : chalk.cyan(stats.min.toString());
      stats.max = uniform ? "-" : chalk.red(stats.max.toString());

      stats.numberOfCalls = chalk.grey(method.numberOfCalls.toString());

      const fnName = this.config.showMethodSig ? method.fnSig : method.method;

      if (!this.config.onlyCalledMethods || method.numberOfCalls > 0) {
        const section: any = [];
        section.push(chalk.grey(method.contract));
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

    data.deployments.forEach(contract => {
      const stats: any = {};
      if (contract.gasData.length === 0) return;

      const total = contract.gasData.reduce((acc, datum) => acc + datum, 0);
      stats.average = Math.round(total / contract.gasData.length);
      stats.percent = gasToPercentOfLimit(stats.average, this.config.blockLimit);

      stats.cost =
        this.config.ethPrice && this.config.gasPrice
          ? gasToCost(
              stats.average,
              this.config.ethPrice,
              this.config.gasPrice
            )
          : chalk.grey("-");

      const sortedData = contract.gasData.sort((a, b) => a - b);
      stats.min = sortedData[0];
      stats.max = sortedData[sortedData.length - 1];

      const uniform = stats.min === stats.max;
      stats.min = uniform ? "-" : chalk.cyan(stats.min.toString());
      stats.max = uniform ? "-" : chalk.red(stats.max.toString());

      const section = [];
      section.push({ hAlign: "left", colSpan: 2, content: contract.name });
      section.push({ hAlign: "right", content: stats.min });
      section.push({ hAlign: "right", content: stats.max });
      section.push({ hAlign: "right", content: stats.average });
      section.push({
        hAlign: "right",
        content: chalk.grey(`${stats.percent} %`)
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
    const leftPad = this.config.rst ? "  " : "";

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

    // Format and load methods metrics
    const solc = getSolcInfo(this.config.solcConfig!);

    const title = [
      {
        hAlign: "center",
        colSpan: 2,
        content: chalk.grey(`Solc version: ${solc.version}`)
      },
      {
        hAlign: "center",
        colSpan: 2,
        content: chalk.grey(`Optimizer enabled: ${solc.optimizer}`)
      },
      {
        hAlign: "center",
        colSpan: 1,
        content: chalk.grey(`Runs: ${solc.runs}`)
      },
      {
        hAlign: "center",
        colSpan: 2,
        content: chalk.grey(`Block limit: ${this.config.blockLimit} gas`)
      }
    ];

    let methodSubtitle;
    if (this.config.ethPrice && this.config.gasPrice) {
      const gwei = this.config.gasPrice;
      const rate = parseFloat(this.config.ethPrice.toString()).toFixed(2);
      const currency = `${this.config.currency.toLowerCase()}`;
      const token = `${this.config.token.toLowerCase()}`;

      methodSubtitle = [
        { hAlign: "left", colSpan: 2, content: chalk.green.bold("Methods") },
        {
          hAlign: "center",
          colSpan: 3,
          content: chalk.grey(`${gwei} gwei/gas`)
        },
        {
          hAlign: "center",
          colSpan: 2,
          content: chalk.red(`${rate} ${currency}/${token}`)
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
      chalk.bold(`${this.config.currency.toLowerCase()} (avg)`)
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
    if (this.config.rst) {
      rstOutput += `${this.config.rstTitle}\n`;
      rstOutput += `${"=".repeat(this.config.rstTitle.length)}\n\n`;
      rstOutput += `.. code-block:: shell\n\n`;
    }

    const tableOutput = rstOutput + table.toString();

    // ---------------------------------------------------------------------------------------------
    // Print
    // ---------------------------------------------------------------------------------------------
    if (this.config.outputFile) {
      fs.writeFileSync(this.config.outputFile, tableOutput);
    } else {
      console.log(tableOutput);
    }

    this.writeJSON(data);
  }

  /**
   * Writes acccumulated data and the current config to gasReporterOutput.json so it
   * can be consumed by codechecks
   * @param  {Object} data  GasData instance
   */
  public writeJSON(data: GasData) {
    const output = {
      namespace: "ethGasReporter",
      config: this.config,
      data
    };

    if (process.env.CI) {
      fs.writeFileSync("./gasReporterOutput.json", JSON.stringify(output));
    }
  }
}
