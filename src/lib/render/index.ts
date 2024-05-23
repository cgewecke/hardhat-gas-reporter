import type { GasData } from "../gasData";
import { writeFileSync } from "fs";
import path from "path";

import { HardhatRuntimeEnvironment as HRE } from "hardhat/types";
import {
  TABLE_NAME_LEGACY,
  TABLE_NAME_MARKDOWN,
  TABLE_NAME_TERMINAL,
  CACHE_FILE_NAME
} from "../../constants";
import { getSolcInfo } from "../../utils/sources";
import { warnReportFormat } from "../../utils/ui";
import { GasReporterOptions } from "../../types";
import { generateTerminalTextTable } from "./terminal";
import { generateLegacyTextTable } from "./legacy";
import { generateMarkdownTable} from "./markdown";
import { generateJSONData, loadJSONCache } from "./json";


/**
 * Table format selector
 * @param {HardhatRuntimeEnvironment} hre
 * @param {GasData}                   data
 * @param {GasReporterOptions}        options
 * @param {string}                    toolchain
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
 * @param {GasReporterOptions}        options
 * @param {string[]}                  warnings
 * @param {string}                    toolchain
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

  if (options.trackGasDeltas) {
    options.cachePath = options.cachePath || path.resolve(
      hre.config.paths.cache,
      CACHE_FILE_NAME
    );

    try {
      const previousData = loadJSONCache(options);
      data.addDeltas(previousData.data!);
    } catch {};
  }


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

  if (options.trackGasDeltas) {
    options.outputJSONFile = options.cachePath!;
    generateJSONData(data, options, toolchain);
  }

  // Write warnings
  for (const warning of warnings) console.log(warning);
}
