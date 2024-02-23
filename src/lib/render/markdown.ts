import  table from "markdown-table";

import _ from "lodash";
import { utils } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GasReporterOptions, MethodDataItem } from "../../types";
import { GasData } from "../gasData";
import { getSolcInfo } from "../../utils/sources";
import { indentMarkdown, entitleMarkdown } from "../../utils/ui";

interface Section {row: string[], contractName: string, methodName: string}

/**
 * Generates a gas statistics table in markdown format.
 * Based on Alan Lu's (github.com/cag) stats for Gnosis
 * @param  {HardhatRuntimeEnvironment} hre
 * @param  {GasData}                   data
 * @param  {GasReporterOptions}        options
 */
export function generateMarkdownTable(
  hre: HardhatRuntimeEnvironment,
  data: GasData,
  options: GasReporterOptions
): string {
  let gasAverageTitle = ["Avg"]
  let alignment;

  const addedContracts: string[] = [];

  if (options.L2 !== undefined) {
    gasAverageTitle = ["L2 Avg", "L1 Avg"];
  }

  // ---------------------------------------------------------------------------------------------
  // Assemble section: Build options
  // ---------------------------------------------------------------------------------------------
  let gwei = "-";
  let currency = "-";
  let rate = "-";
  let token = "-";

  const solc = getSolcInfo(hre.config.solidity.compilers[0]);

  if (options.tokenPrice && options.gasPrice) {
    gwei = `${options.gasPrice} gwei/gas`;
    currency = `${options.currency!.toLowerCase()}`;
    token = options.token!.toLowerCase();
    rate = `${parseFloat(options.tokenPrice).toFixed(2)} ${currency}/${token}`;
  }

  const optionsRows: readonly string[][] = [
    ["Option", "Settings"],
    ["solc: version", solc.version],
    ["solc: optimized", solc.optimizer],
    ["solc: runs", solc.runs.toString()],
    ["solc: viaIR", solc.viaIR.toString()],
    ["gas: block limit", utils.commify(hre.__hhgrec.blockGasLimit!)],
    ["gas: price", gwei],
    ["market: currency rate", rate]
  ];

  const optionsTable = table(optionsRows);

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
      stats.executionGasAverage = utils.commify(method.executionGasAverage!);
      stats.cost = (method.cost === undefined) ? "-" : method.cost;

      if (method.calldataGasAverage !== undefined) {
        stats.calldataGasAverage = utils.commify(method.calldataGasAverage)
      };
    } else {
      stats.executionGasAverage = "-";
      stats.cost = "-";
    }

    if (method.min && method.max) {
      const uniform = (method.min === method.max);
      stats.min = uniform ? "-" : utils.commify(method.min!);
      stats.max = uniform ? "-" : utils.commify(method.max!);
    }

    stats.numberOfCalls = method.numberOfCalls.toString();

    const fnName = options.showMethodSig ? method.fnSig : method.method;

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
          indentMarkdown(fnName),
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
      stats.min = uniform ? "-" : utils.commify(deployment.min!);
      stats.max = uniform ? "-" : utils.commify(deployment.max!);
    }

    stats.percent = deployment.percent;
    stats.executionGasAverage = utils.commify(deployment.executionGasAverage!);

    if (deployment.calldataGasAverage !== undefined) {
      stats.calldataGasAverage = utils.commify(deployment.calldataGasAverage)
    };

    const averages = (options.L2 !== undefined)
      ? [stats.executionGasAverage, stats.calldataGasAverage]
      : [stats.executionGasAverage];

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

  const optionsTitle = "## Build Configuration\n";
  const methodTitle = "## Methods\n";
  const deployTitle = "## Deployments\n";

  const md =
    `${methodTitle +
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

