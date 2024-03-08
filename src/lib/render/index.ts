import type { GasData } from "../gasData";
import { writeFileSync } from "fs";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import { warnReportFormat } from "../../utils/ui";
import {
  TABLE_NAME_LEGACY,
  TABLE_NAME_MARKDOWN,
  TABLE_NAME_TERMINAL
} from "../../constants";

import { GasReporterOptions } from "../../types";
import { getSolcInfo } from "../../utils/sources";
import { generateTerminalTextTable } from "./terminal";
import { generateLegacyTextTable } from "./legacy";
import { generateMarkdownTable} from "./markdown";
import { generateJSONData } from "./json";


/**
 * Table format selector
 * @param {HardhatRuntimeEnvironment} hre
 * @param {GasData}                   data
 * @param {GasReporterOptions}        options
 * @returns {string}                  table
 */
export function getTableForFormat(
  hre: HRE,
  data: GasData,
  options: GasReporterOptions,
  toolchain="hardhat"
): string {
  switch (options.reportFormat) {
    case TABLE_NAME_LEGACY:    return generateLegacyTextTable(hre, data, options);
    case TABLE_NAME_TERMINAL:  return generateTerminalTextTable(hre, data, options, toolchain);
    case TABLE_NAME_MARKDOWN:  return generateMarkdownTable(hre, data, options, toolchain);
    default: warnReportFormat(options.reportFormat); return "";
  }
}

/**
 * Manages table rendering and file saving
 * @param {HardhatRuntimeEnvironment} hre
 * @param {GasData}                   data
 * @param {GasReporterOptions}        options
 */
export function render(
  hre: HRE,
  options: GasReporterOptions,
  warnings: string[],
  toolchain="hardhat"
) {
  const data = hre.__hhgrec.collector!.data;
  options.blockGasLimit = hre.__hhgrec.blockGasLimit;
  options.solcInfo = getSolcInfo(hre.config.solidity.compilers[0]);


  // Get table
  let table = getTableForFormat(hre, data, options, toolchain);

  // ---------------------------------------------------------------------------------------------
  // RST / ReadTheDocs / Sphinx output
  // ---------------------------------------------------------------------------------------------
  let rstOutput = "";
  if (options.rst) {
    rstOutput += `${options.rstTitle!}\n`;
    rstOutput += `${"=".repeat(options.rstTitle!.length)}\n\n`;
    rstOutput += `.. code-block:: shell\n\n`;
  }

  table = rstOutput + table;

  // ---------------------------------------------------------------------------------------------
  // Print
  // ---------------------------------------------------------------------------------------------
  if (options.outputFile) {
    writeFileSync(options.outputFile, table);

    // Regenerate the table with full color if also logging to console
    if (options.forceTerminalOutput){
      const originalOutputFile = options.outputFile;
      const originalNoColors = options.noColors;
      const originalReportFormat = options.reportFormat;

      options.outputFile = undefined;
      options.noColors = false;

      options.reportFormat = (options.forceTerminalOutputFormat)
        ? options.forceTerminalOutputFormat
        : options.reportFormat;

      table = getTableForFormat(hre, data, options);
      console.log(table);

      // Reset the options, since they might be read in JSON below here
      options.outputFile = originalOutputFile;
      options.noColors = originalNoColors;
      options.reportFormat = originalReportFormat;
    }
  } else if (!options.suppressTerminalOutput) {
    console.log(table);
  }

  if (options.outputJSON || process.env.CI) {
    generateJSONData(data, options, toolchain);
  }

  // Write warnings
  for (const warning of warnings) console.log(warning);
}
