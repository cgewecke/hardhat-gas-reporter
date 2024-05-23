import { EOL } from "os";
import  table from "markdown-table";
import _ from "lodash";
import { commify } from "@ethersproject/units";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UNICODE_CIRCLE, UNICODE_TRIANGLE } from "../../constants";
import { GasData } from "../gasData";
import {
  indentMarkdown,
  indentMarkdownWithSymbol,
  entitleMarkdown,
  getCommonTableVals,
  costIsBelowPrecision,
  markdownBold
} from "../../utils/ui";

import { GasReporterOptions, MethodDataItem } from "../../types";
interface Section {row: string[], contractName: string, methodName: string}

/**
 * Generates a gas statistics table in markdown format.
 * Based on Alan Lu's (github.com/cag) stats for Gnosis
 * @param  {HardhatRuntimeEnvironment} hre
 * @param  {GasData}                   data
 * @param  {GasReporterOptions}        options
 * @param  {string}                    toolchain
 */
export function generateMarkdownTable(
  hre: HardhatRuntimeEnvironment,
  data: GasData,
  options: GasReporterOptions,
  toolchain: string
): string {
  let gasAverageTitle = ["Avg"]
  let alignment;

  const addedContracts: string[] = [];

  if (options.L2 === "optimism" || options.L2 === "base") {
    gasAverageTitle = ["L2 Avg (Exec)", "L1 Avg (Data)"];
  }

  if (options.L2 === "arbitrum") {
    gasAverageTitle = ["L2 Avg (Exec)", "L1 Avg (Bytes)"];
  }

  // ---------------------------------------------------------------------------------------------
  // Assemble section: Build options
  // ---------------------------------------------------------------------------------------------
  let gasPrices: string[][];
  let l1gwei: string | number | undefined;
  let l2gwei: string | number | undefined;
  let l1GweiBlobBaseFee: string | number | undefined;
  const { network, currency, nonZeroMsg, intrinsicMsg } = getCommonTableVals(options);
  let tokenPrice = "-";
  let rate: string;
  let token: string;

  if (options.tokenPrice && options.gasPrice) {
    ({
      l1gwei,
      l2gwei,
      l1GweiBlobBaseFee,
      rate,
      token
    } = getCommonTableVals(options));

    gasPrices = (options.L2)
      ? (options.L2 === "arbitrum")
          ? [
              [`L1 Base Fee Per Byte`, `${options.baseFeePerByte!} gwei`],
              [`L2 Gas Price`, `${l2gwei} gwei` ]
            ]
          : [
              [`L1 Base Fee`, `${options.baseFee!} gwei`],
              [`L1 Blob Base Fee`, `${l1GweiBlobBaseFee!} gwei`],
              [`L2 Gas Price`, `${l2gwei} gwei` ]
            ]

      : [[`L1 Gas Price`, `${l1gwei} gwei`]];

    tokenPrice = `${rate} ${currency}/${token}`
  } else {
    gasPrices = [["Gas Price", "-" ]];
  }

  const optionsRows: readonly string[][] = [
    ["**Settings**", "**Value**"],
    ["Solidity: version", options.solcInfo.version],
    ["Solidity: optimized", options.solcInfo.optimizer],
    ["Solidity: runs", options.solcInfo.runs.toString()],
    ["Solidity: viaIR", options.solcInfo.viaIR.toString()],
    ["Block Limit", commify(options.blockGasLimit!)],
    ...gasPrices,
    ["Token Price", tokenPrice],
    ["Network", network],
    ["Toolchain", toolchain]
  ];

  const keyRows: readonly string[][] = [
    ["**Symbol**", "**Meaning**"],
    [markdownBold(UNICODE_CIRCLE), intrinsicMsg],
    [markdownBold(UNICODE_TRIANGLE), nonZeroMsg]
  ];

  const optionsTable = table(optionsRows);
  const keyTable = table(keyRows, { align: ["c", "l"] });

  // ---------------------------------------------------------------------------------------------
  // Assemble section: methods
  // ---------------------------------------------------------------------------------------------

  const methodRows: Section[] = [];
  const methodHeader = [
    "",
    "Min",
    "Max",
    ...gasAverageTitle,
    "Calls",
    `${currency} avg`
  ];

  _.forEach(data.methods, (method: MethodDataItem) => {
    if (!method) return;

    const stats: any = {};

    if (method.gasData.length > 0) {
      stats.executionGasAverage = commify(method.executionGasAverage!);
      stats.cost = (method.cost === undefined) ? "-" : method.cost;

      if (method.calldataGasAverage !== undefined) {
        stats.calldataGasAverage = (method.calldataGasAverage === 0)
          ? "-"
          : commify(method.calldataGasAverage);
      };
    } else {
      stats.executionGasAverage = "-";
      stats.cost = "-";
    }

    if (costIsBelowPrecision(stats.cost, options)){
      stats.cost = markdownBold(UNICODE_TRIANGLE);
    }

    if (method.min && method.max) {
      const uniform = (method.min === method.max);
      stats.min = uniform ? "-" : commify(method.min!);
      stats.max = uniform ? "-" : commify(method.max!);
    }

    stats.numberOfCalls = method.numberOfCalls.toString();

    const fnName = options.showMethodSig ? method.fnSig : method.method;

    const indented = (method.isCall)
      ? indentMarkdownWithSymbol(fnName, markdownBold(UNICODE_CIRCLE))
      : indentMarkdown(fnName);

    if (method.numberOfCalls > 0) {
      // Contracts name row
      if (!addedContracts.includes(method.contract)) {
        addedContracts.push(method.contract);

        const titleSection: Section = {
          row: [
            entitleMarkdown(method.contract),
            " ",
            " ",
            " ",
            " ",
            " ",
          ],
          contractName: method.contract,
          methodName: "0"
        }

        methodRows.push(titleSection)
      }

      const averages = (options.L2 !== undefined)
        ? [stats.executionGasAverage, stats.calldataGasAverage]
        : [stats.executionGasAverage];

      // Method row
      const methodSection = {
        row: [
          indented,
          stats.min,
          stats.max,
          ...averages,
          method.numberOfCalls.toString(),
          stats.cost.toString()
        ],
        contractName: method.contract,
        methodName: fnName
      }

      methodRows.push(methodSection);
    }
  });

  methodRows.sort((a, b) => {
    const contractName = a.contractName.localeCompare(b.contractName);
    const methodName = a.methodName.localeCompare(b.methodName);
    return contractName || methodName;
  });

  const rows = methodRows.map(val => val.row);

  alignment = { align: ["l", "r", "r", "r", "r", "r", "r", "r"] };
  rows.unshift(methodHeader);
  const methodTable = table(rows, alignment);

  // ---------------------------------------------------------------------------------------------
  // Assemble section: deployments
  // ---------------------------------------------------------------------------------------------
  const deployRows = [];
  const deployHeader = [
    "",
    "Min",
    "Max ",
    ...gasAverageTitle,
    "Block %",
    `${currency} avg`
  ];

  // Alphabetize contract names
  data.deployments.sort((a, b) => a.name.localeCompare(b.name));

  data.deployments.forEach(deployment => {
    const stats: any = {};
    if (!deployment.gasData.length) return;

    stats.cost = (deployment.cost === undefined) ? "-" : deployment.cost;

    if (deployment.min && deployment.max) {
      const uniform = deployment.min === deployment.max;
      stats.min = uniform ? "-" : commify(deployment.min!);
      stats.max = uniform ? "-" : commify(deployment.max!);
    }

    stats.percent = deployment.percent;
    stats.executionGasAverage = commify(deployment.executionGasAverage!);

    if (deployment.calldataGasAverage !== undefined) {
      stats.calldataGasAverage = commify(deployment.calldataGasAverage)
    };

    const averages = (options.L2 !== undefined)
      ? [stats.executionGasAverage, stats.calldataGasAverage]
      : [stats.executionGasAverage];

    if (costIsBelowPrecision(stats.cost, options)){
      stats.cost = markdownBold(UNICODE_TRIANGLE);
    }

    const section = [
      entitleMarkdown(deployment.name),
      stats.min,
      stats.max,
      ...averages,
      `${stats.percent} %`,
      stats.cost
    ];

    deployRows.push(section);
  });

  alignment = { align: ["l", "r", "r", "r", "r", "r", "r"] };
  deployRows.unshift(deployHeader);
  const deployTable = table(deployRows, alignment);

  // ---------------------------------------------------------------------------------------------
  // Final assembly
  // ---------------------------------------------------------------------------------------------

  const optionsTitle = `## Solidity and Network Config${  EOL}`;
  const methodTitle = `## Methods${  EOL}`;
  const deployTitle = `## Deployments${  EOL}`;

  const md =
    `${methodTitle +
    keyTable + EOL + EOL +
    methodTable
    }\n\n${
    deployTitle
    }${deployTable
    }\n\n${
    optionsTitle
    }${optionsTable
    }\n\n`;

  // ---------------------------------------------------------------------------------------------
  // Finish
  // ---------------------------------------------------------------------------------------------
  return md;
}
