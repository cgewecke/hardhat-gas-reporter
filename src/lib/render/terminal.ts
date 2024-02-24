import chalk, {Chalk} from "chalk";

import _ from "lodash";
import Table, { HorizontalTableRow } from "cli-table3";
import { utils } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getSolcInfo } from "../../utils/sources";

import { GasReporterOptions, MethodDataItem } from "../../types";
import { GasData } from "../gasData";
import { indentText } from "../../utils/ui";
import {
  DEFAULT_SUBZERO_GAS_PRICE_PRECISION,
  UNICODE_AIR,
  UNICODE_OMEGA
} from "../../constants";

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
    optionalColor = chalk.bold;
  }

  if (options.L2 !== undefined) {
    numberOfCols = 8;
    blockLimitColumnWidth = 3;
    deploymentsTitleSpacerWidth = 3;
    contractTitleSpacerWidth = 6;
    executionGasAverageTitle = "L2 Avg (Exec)";
    calldataGasAverageTitle = "L1 Avg (Data)"
  }

  // eslint-disable-next-line
  const emptyRow = [{ colSpan: numberOfCols, content:"" }]

  // ---------------------------------------------------------------------------------------------
  // Methods: section assembly
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

    // Notify when value is below is precision
    if (typeof stats.cost === "number" && stats.cost < .01) {
      stats.cost = UNICODE_AIR;
    }

    if (method.min && method.max) {
      const uniform = (method.min === method.max);
      stats.min = uniform ? chalk.grey("-") : chalk.cyan(utils.commify(method.min!));
      stats.max = uniform ? chalk.grey("-") : chalk.red(utils.commify(method.max!));
    }

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

      row.push({ hAlign: "right", colSpan: 1, content: method.numberOfCalls });
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
  // Deployments: section assembly
  // ---------------------------------------------------------------------------------------------
  const deployRows: any = [];
  // Alphabetize contract names
  data.deployments.sort((a, b) => a.name.localeCompare(b.name));

  data.deployments.forEach(deployment => {
    const stats: any = {};
    if (deployment.gasData.length === 0) return;

    stats.cost = (deployment.cost === undefined) ? chalk.grey("-") : deployment.cost;

    // Notify when value is below precision
    if (typeof stats.cost === "number" && stats.cost < .01) {
      stats.cost = UNICODE_AIR;
    }

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
      content: `${deployment.percent!} %`
    });
    section.push({
      hAlign: "right",
      colSpan: 1,
      content: chalk.green(stats.cost.toString())
    });

    deployRows.push(section);
  });

  // ---------------------------------------------------------------------------------------------
  // Headers: section assembly
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
      top: "·",
      bottom: "·",
      "bottom-mid": "|"
    }
  });

  const title: HorizontalTableRow = [
    {
      hAlign: "left",
      colSpan: numberOfCols,
      content: chalk.green.bold(`Solidity and Network Configuration`)
    }
  ];

  // ============
  // SOLC CONFIG
  // ============
  const solc = getSolcInfo(hre.config.solidity.compilers[0]);

  // Format and load methods metrics
  const solcConfig: HorizontalTableRow = [
    {
      hAlign: "left",
      colSpan: 2,
      content: chalk.cyan(`Solidity: ${solc.version}`)
    },
    {
      hAlign: "left",
      colSpan: 1,
      content: chalk.cyan(`Optimizer: ${solc.optimizer}`)
    },
    {
      hAlign: "left",
      colSpan: 1,
      content: chalk.cyan(`viaIR: ${solc.viaIR}`)
    },
    {
      hAlign: "left",
      colSpan: 1,
      content: chalk.cyan(`Runs: ${solc.runs}`)
    },
    {
      hAlign: "center",
      colSpan: blockLimitColumnWidth,
      content: chalk.cyan(`Block limit: ${utils.commify(hre.__hhgrec.blockGasLimit!)} gas`)
    }
  ];

  // ==============
  // NETWORK CONFIG
  // ==============
  let networkConfig: HorizontalTableRow = [];

  if (options.tokenPrice && options.gasPrice) {
    let L1gwei: string | number = (options.L2 === undefined)
      ? options.gasPrice
      : options.baseFee!;

    let L2gwei: string | number = (options.L2 === undefined)
      ? ""
      : options.gasPrice;

    const network = (options.L2 === undefined)
      ? "L1 EVM"
      : `${options.L2}`

    // Truncate subzero gas prices to 5 decimal precision
    if (typeof L1gwei === "number" && L1gwei < 1) {
      L1gwei = parseFloat(L1gwei.toString()).toFixed(DEFAULT_SUBZERO_GAS_PRICE_PRECISION);
    }

    if (typeof L2gwei === "number" && L2gwei < 1) {
      L2gwei = parseFloat(L2gwei.toString()).toFixed(DEFAULT_SUBZERO_GAS_PRICE_PRECISION);
    }

    const rate = parseFloat(options.tokenPrice.toString()).toFixed(2);
    const currency = `${options.currency!.toLowerCase()}`;
    const token = `${options.token!.toLowerCase()}`;

    networkConfig.push({
      hAlign: "left",
      colSpan: 2,
      content: chalk.cyan(`Network: ${network}`)
    });

    // TODO: Clarify that this is baseFee not gasPrice when L2
    networkConfig.push({
      hAlign: "left",
      colSpan: 2,
      content: chalk.cyan(`L1: ${L1gwei} gwei/gas`)
    });

    if (options.L2 !== undefined) {
      networkConfig.push({
        hAlign: "left",
        colSpan: 2,
        content: chalk.cyan(`L2: ${L2gwei} gwei/gas`)
      });
    } else {
      networkConfig.push({ colSpan: 1, content: " " })
    }

    networkConfig.push({
        hAlign: "center",
        colSpan: 2,
        content: chalk.red(`${rate} ${currency}/${token}`)
    });
  } else {
    networkConfig = [
      { hAlign: "left", colSpan: numberOfCols, content: chalk.green.bold("Methods") }
    ];
  }

  // ===============
  // METHODS HEADER
  // ===============
  const methodsHeader: HorizontalTableRow = [];
  methodsHeader.push({ hAlign: "left", colSpan: 2, content: chalk.green.bold("Contracts / Methods") });
  methodsHeader.push({ hAlign: "left", colSpan: 1, content: chalk.green("Min") });
  methodsHeader.push({ hAlign: "left", colSpan: 1, content: chalk.green("Max") });
  methodsHeader.push({ hAlign: "left", colSpan: 1, content: chalk.green(executionGasAverageTitle) })

  if (options.L2 !== undefined) {
    methodsHeader.push({ hAlign: "left", colSpan: 1, content: chalk.green(calldataGasAverageTitle) })
  }

  methodsHeader.push({ hAlign: "left", colSpan: 1, content: chalk.bold("# calls") });
  methodsHeader.push({ hAlign: "left", colSpan: 1, content: chalk.bold(`${options.currency!.toLowerCase()} (avg)`) });

  // ===============
  // SYMBOL KEY
  // ===============
  const air = "Cost was non-zero but below the 2 decimal precision threshold of the currency display";
  const call = "Execution gas vals for methods with this symbol do not include intrinsic gas overhead " +
               "(due to `eth_call` or user preference)";

  const keyTitle: HorizontalTableRow = [{
    hAlign: "left", colSpan: numberOfCols, content: chalk.green.bold("Key")
  }];
  const keyCall: HorizontalTableRow =[{
    hAlign: "left", colSpan: numberOfCols, content: `${chalk.red(UNICODE_OMEGA)}: ${call}`
  }];
  const keyAir: HorizontalTableRow = [{
    hAlign: "left", colSpan: numberOfCols, content: `${chalk.red(UNICODE_AIR)}: ${air}`
  }];

  // ---------------------------------------------------------------------------------------------
  // Final table assembly
  // ---------------------------------------------------------------------------------------------
  table.push(title);
  table.push(solcConfig);
  table.push(networkConfig);
  table.push(methodsHeader);

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

  table.push(keyTitle);
  table.push(keyCall);
  table.push(keyAir);

  return table.toString();
}

