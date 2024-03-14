import chalk, {Chalk} from "chalk";
import _ from "lodash";
import Table, { HorizontalTableRow } from "cli-table3";
import { commify } from "@ethersproject/units";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GasReporterOptions, MethodDataItem } from "../../types";

import { GasData } from "../gasData";

/**
 * LEGACY ONLY
 * IGNORE THIS FORMAT WHEN ADDING INFO TO TABLES (UNLESS BUG FIXING)
 */

/**
 * Generates a gas statistics text table formatted for terminal or file.
 * Based on Alan Lu's (github.com/cag) stats for Gnosis
 * @param  {HardhatRuntimeEnvironment} hre
 * @param  {GasData}                   data
 * @param  {GasReporterOptions}        options
 */
export function generateLegacyTextTable(
  hre: HardhatRuntimeEnvironment,
  data: GasData,
  options: GasReporterOptions
): string {

  let optionalColor: Chalk;

  if (options.noColors || options.outputFile !== undefined) {
    chalk.level = 0;
  } else {
    chalk.level = 1;
  }

  if (options.darkMode) {
    optionalColor = chalk.cyan;
  } else {
    optionalColor = chalk.grey;
  }

  // ---------------------------------------------------------------------------------------------
  // Assemble section: methods
  // ---------------------------------------------------------------------------------------------
  const methodRows: any[] = [];

  _.forEach(data.methods, (method: MethodDataItem) => {
    if (!method) return;

    const stats: any = {};

    if (method.gasData.length > 0) {
      stats.executionGasAverage = commify(method.executionGasAverage!);
      stats.cost = (method.cost === undefined) ? chalk.grey("-") : method.cost;
    } else {
      stats.executionGasAverage = chalk.grey("-");
      stats.cost = chalk.grey("-");
    }

    if (method.min && method.max) {
      const uniform = (method.min === method.max);
      stats.min = uniform ? chalk.grey("-") : chalk.cyan(commify(method.min!));
      stats.max = uniform ? chalk.grey("-") : chalk.red(commify(method.max!));
    }

    stats.numberOfCalls = optionalColor(method.numberOfCalls.toString());

    const fnName = options.showMethodSig ? method.fnSig : method.method;

    if (options.showUncalledMethods || method.numberOfCalls > 0) {
      const section: any = [];
      section.push(optionalColor.bold(method.contract));
      section.push(fnName);
      section.push({ hAlign: "right", content: stats.min });
      section.push({ hAlign: "right", content: stats.max });
      section.push({ hAlign: "right", content: stats.executionGasAverage });
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
      stats.min = uniform ? chalk.grey("-") : chalk.cyan(commify(deployment.min!));
      stats.max = uniform ? chalk.grey("-") : chalk.red(commify(deployment.max!));
    }

    const section: any = [];
    section.push({ hAlign: "left", colSpan: 2, content: deployment.name });
    section.push({ hAlign: "right", content: stats.min });
    section.push({ hAlign: "right", content: stats.max });
    section.push({ hAlign: "right", content: commify(deployment.executionGasAverage!) });
    section.push({
      hAlign: "right",
      content: optionalColor(`${deployment.percent!} %`)
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

  // Format and load methods metrics
  const title = [
    {
      hAlign: "center",
      colSpan: 2,
      content: optionalColor.bold(`Solc version: ${options.solcInfo.version}`)
    },
    {
      hAlign: "center",
      colSpan: 2,
      content: optionalColor.bold(`Optimizer enabled: ${options.solcInfo.optimizer}`)
    },
    {
      hAlign: "center",
      colSpan: 1,
      content: optionalColor.bold(`Runs: ${options.solcInfo.runs}`)
    },
    {
      hAlign: "center",
      colSpan: 2,
      content: optionalColor.bold(`Block limit: ${commify(options.blockGasLimit!)} gas`)
    }
  ];

  let methodSubtitle;
  if (options.tokenPrice && options.gasPrice) {
    const gwei = options.gasPrice;
    const rate = parseFloat(options.tokenPrice.toString()).toFixed(2);
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

  return table.toString();
}

