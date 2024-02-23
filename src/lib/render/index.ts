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
 * Manages table rendering and file saving
 * @param {HardhatRuntimeEnvironment} hre
 * @param {GasData}                   data
 * @param {GasReporterOptions}        options
 */
export function render(hre: HardhatRuntimeEnvironment, data: GasData, options: GasReporterOptions) {
  let table: string = "";

  switch (options.reportFormat) {
    case TABLE_NAME_LEGACY:    table = generateLegacyTextTable(hre, data, options);   break;
    case TABLE_NAME_TERMINAL:  table = generateTerminalTextTable(hre, data, options); break;
    case TABLE_NAME_MARKDOWN:  table = generateMarkdownTable(hre, data, options);     break;
    default: warnReportFormat(options.reportFormat);
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

  table = rstOutput + table;

  // ---------------------------------------------------------------------------------------------
  // Print
  // ---------------------------------------------------------------------------------------------
  if (options.outputFile) {
    writeFileSync(options.outputFile, table);
  } else {
    console.log(table);
  }

  if (options.outputJSON || process.env.CI) {
    generateJSONData(data, options);
  }
}
