import type { GasData } from "../gasData";
import { writeFileSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GasReporterOptions } from "../../types";
import { warnReportFormat } from "../../utils/ui";
import { TABLE_NAME_LEGACY, TABLE_NAME_MARKDOWN, TABLE_NAME_TERMINAL } from "../../constants";
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
export function getTableForFormat(hre: HardhatRuntimeEnvironment, data: GasData, options: GasReporterOptions): string {
  switch (options.reportFormat) {
    case TABLE_NAME_LEGACY:    return generateLegacyTextTable(hre, data, options);
    case TABLE_NAME_TERMINAL:  return generateTerminalTextTable(hre, data, options);
    case TABLE_NAME_MARKDOWN:  return generateMarkdownTable(hre, data, options);
    default: warnReportFormat(options.reportFormat); return "";
  }
}

/**
 * Manages table rendering and file saving
 * @param {HardhatRuntimeEnvironment} hre
 * @param {GasData}                   data
 * @param {GasReporterOptions}        options
 */
export function render(hre: HardhatRuntimeEnvironment, options: GasReporterOptions, warnings: string[]) {
  const data = hre.__hhgrec.collector!.data;

  // Get table
  let table = getTableForFormat(hre, data, options);

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
  } else {
    console.log(table);
  }

  if (options.outputJSON || process.env.CI) {
    generateJSONData(data, options);
  }

  // Write warnings
  for (const warning of warnings) console.log(warning);
}
