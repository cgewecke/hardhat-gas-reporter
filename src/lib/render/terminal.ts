import chalk, {Chalk} from "chalk";

import _ from "lodash";
import Table, { HorizontalTableRow } from "cli-table3";
import { utils } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSolcInfo } from "../../utils/sources";

import { GasReporterOptions, MethodDataItem } from "../../types";
import { GasData } from "../gasData";
import { indentText } from "../../utils/ui";

interface Section {row: HorizontalTableRow, contractName: string, methodName: string}

/**
 * Generates a gas statistics text table formatted for terminal or file.
 * Based on Alan Lu's (github.com/cag) stats for Gnosis
 * @param  {HardhatRuntimeEnvironment} hre
 * @param  {GasData}                   data
 * @param  {GasReporterOptions}        options
 */
export function generateTerminalTextTable(
  hre: HardhatRuntimeEnvironment,
  data: GasData,
  options: GasReporterOptions
): string {
  // Default cols (without L2)
  let numberOfCols = 7;
  let blockLimitColumnWidth = 2;
  let deploymentsTitleSpacerWidth = 2;
  let contractTitleSpacerWidth = 5;
  let executionGasAverageTitle = "Avg"
  let calldataGasAverageTitle = "";

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

  if (options.L2 !== undefined) {
    numberOfCols = 8;
    blockLimitColumnWidth = 3;
    deploymentsTitleSpacerWidth = 3;
    contractTitleSpacerWidth = 6;
    executionGasAverageTitle = "L2 Avg";
    calldataGasAverageTitle = "L1 Avg"
  }

  // ---------------------------------------------------------------------------------------------
  // Assemble section: methods
  // ---------------------------------------------------------------------------------------------
  const methodRows: Section[] = [];
  const addedContracts: any[] = [];

  _.forEach(data.methods, (method: MethodDataItem) => {
    if (!method) return;

    // Contracts name row
    if (!addedContracts.includes(method.contract) && method.gasData.length > 0) {
      addedContracts.push(method.contract);

      const contractNameSection: Section = {
        row: [
          { hAlign: "left", colSpan: 2, content: `${optionalColor(method.contract)}` },
          { hAlign: "left", colSpan: contractTitleSpacerWidth, content: "" }
        ],
        contractName: method.contract,
        methodName: "0"
      };
      methodRows.push(contractNameSection)
    }

    const stats: any = {};

    if (method.gasData.length > 0) {
      stats.executionGasAverage = utils.commify(method.executionGasAverage!);
      stats.cost = (method.cost === undefined) ? chalk.grey("-") : method.cost;

      stats.calldataGasAverage = (method.calldataGasAverage !== undefined)
        ?  utils.commify(method.calldataGasAverage)
        : "";

    } else {
      stats.executionGasAverage = chalk.grey("-");
      stats.cost = chalk.grey("-");
    }

    if (method.min && method.max) {
      const uniform = (method.min === method.max);
      stats.min = uniform ? chalk.grey("-") : chalk.cyan(utils.commify(method.min!));
      stats.max = uniform ? chalk.grey("-") : chalk.red(utils.commify(method.max!));
    }

    stats.numberOfCalls = optionalColor(method.numberOfCalls.toString());

    const fnName = options.showMethodSig ? method.fnSig : method.method;

    if (options.showUncalledMethods || method.numberOfCalls > 0) {
      const row: HorizontalTableRow = [];
      row.push({ hAlign: "left", colSpan: 2, content: indentText(fnName) });
      row.push({ hAlign: "right", colSpan: 1, content: stats.min });
      row.push({ hAlign: "right", colSpan: 1, content: stats.max });
      row.push({ hAlign: "right", colSpan: 1, content: stats.executionGasAverage });

      if (options.L2 !== undefined) {
        row.push({ hAlign: "right", colSpan: 1, content: stats.calldataGasAverage });
      }

      row.push({ hAlign: "right", colSpan: 1, content: stats.numberOfCalls });
      row.push({
        hAlign: "right",
        colSpan: 1,
        content: chalk.green(stats.cost.toString())
      });

      const section: Section = {
        row,
        contractName: method.contract,
        methodName: fnName
      };

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
    stats.calldataGasAverage = (deployment.calldataGasAverage === undefined )
      ? ""
      : utils.commify(deployment.calldataGasAverage);

    if (deployment.min && deployment.max) {
      const uniform = deployment.min === deployment.max;
      stats.min = uniform ? chalk.grey("-") : chalk.cyan(utils.commify(deployment.min!));
      stats.max = uniform ? chalk.grey("-") : chalk.red(utils.commify(deployment.max!));
    }

    const section: any = [];
    section.push({ hAlign: "left", colSpan: 2, content: deployment.name });
    section.push({ hAlign: "right", colSpan: 1, content: stats.min });
    section.push({ hAlign: "right", colSpan: 1, content: stats.max });
    section.push({ hAlign: "right", colSpan: 1, content: utils.commify(deployment.executionGasAverage!) });

    if (options.L2 !== undefined) {
      section.push({ hAlign: "right", colSpan: 1, content: stats.calldataGasAverage! })
    }

    section.push({
      hAlign: "right",
      colSpan: 1,
      content: optionalColor(`${deployment.percent!} %`)
    });
    section.push({
      hAlign: "right",
      colSpan: 1,
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
    colWidths: [numberOfCols],
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
  const title: HorizontalTableRow = [
    {
      hAlign: "center",
      colSpan: 2,
      content: optionalColor(`Solc: ${solc.version}`)
    },
    {
      hAlign: "center",
      colSpan: 2,
      content: optionalColor(`Optimizer enabled: ${solc.optimizer}`)
    },
    {
      hAlign: "center",
      colSpan: 1,
      content: optionalColor(`Runs: ${solc.runs}`)
    },
    {
      hAlign: "center",
      colSpan: blockLimitColumnWidth,
      content: optionalColor(`Block limit: ${utils.commify(hre.__hhgrec.blockGasLimit!)} gas`)
    }
  ];

  let methodSubtitle: HorizontalTableRow = [];
  if (options.tokenPrice && options.gasPrice) {
    const L1gwei = options.gasPrice;
    const L2gwei = (options.L2gasPrice === undefined) ? "" : options.L2gasPrice;
    const network = (options.L2 === undefined) ? "L1 EVM" : `${options.L2}`

    const rate = parseFloat(options.tokenPrice.toString()).toFixed(2);
    const currency = `${options.currency!.toLowerCase()}`;
    const token = `${options.token!.toLowerCase()}`;

    methodSubtitle.push({
      hAlign: "center",
      colSpan: 2,
      content: chalk.green.bold(`Network: ${network}`)
    });

    methodSubtitle.push({
      hAlign: "center",
      colSpan: 2,
      content: chalk.cyan.bold(`L1: ${L1gwei} gwei/gas`)
    });

    if (options.L2 !== undefined) {
      methodSubtitle.push({
        hAlign: "center",
        colSpan: 2,
        content: chalk.cyan.bold(`L2: ${L2gwei} gwei/gas`)
      });
    } else {
      methodSubtitle.push({ colSpan: 1, content: " " })
    }

    methodSubtitle.push({
        hAlign: "center",
        colSpan: 2,
        content: chalk.red.bold(`${rate} ${currency}/${token}`)
    });
  } else {
    methodSubtitle = [
      { hAlign: "left", colSpan: numberOfCols, content: chalk.green.bold("Methods") }
    ];
  }

  const header: HorizontalTableRow = [];
  header.push({ hAlign: "left", colSpan: 2, content: chalk.bold("Contracts / Methods") });
  header.push({ hAlign: "left", colSpan: 1, content: chalk.green("Min") });
  header.push({ hAlign: "left", colSpan: 1, content: chalk.green("Max") });
  header.push({ hAlign: "left", colSpan: 1, content: chalk.green(executionGasAverageTitle) })

  if (options.L2 !== undefined) {
    header.push({ hAlign: "left", colSpan: 1, content: chalk.green(calldataGasAverageTitle) })
  }

  header.push({ hAlign: "left", colSpan: 1, content: chalk.bold("# calls") });
  header.push({ hAlign: "left", colSpan: 1, content: chalk.bold(`${options.currency!.toLowerCase()} (avg)`) });

  // ---------------------------------------------------------------------------------------------
  // Final assembly
  // ---------------------------------------------------------------------------------------------
  table.push(title);
  table.push(methodSubtitle);
  table.push(header);

  methodRows.sort((a, b) => {
    const contractName = a.contractName.localeCompare(b.contractName);
    const methodName = a.methodName.localeCompare(b.methodName);
    return contractName || methodName;
  });

  const rows = methodRows.map(val => val.row);

  rows.forEach(row => table.push(row));

  if (deployRows.length) {
    const deploymentsSubtitle = [
      {
        hAlign: "left",
        colSpan: 3,
        content: chalk.green.bold("Deployments")
      },
      { hAlign: "right", colSpan: deploymentsTitleSpacerWidth, content: "" },
      { hAlign: "left", colSpan: 1, content: chalk.bold(`% of limit`) },
      { hAlign: "left", colSpan: 1, content: "" }
    ];
    table.push(deploymentsSubtitle as HorizontalTableRow);
    deployRows.forEach((row: any) => table.push(row));
  }

  return table.toString();
}

