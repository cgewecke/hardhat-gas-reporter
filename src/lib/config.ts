import { SolcConfig } from "hardhat/types";
import { HardhatGasReporterOptions } from "../types";

/**
 * Configuration defaults
 */
export class Config {

  // Chain Info
  public blockLimit: number;
  public defaultGasPrice: number;
  public gasPrice: number | null;
  public gasPriceApi: string;
  public token: string;

  // Pricing
  public currency: string;
  public ethPrice: number | null;
  public coinmarketcap: string | null;

  // Display
  public showMethodSig: boolean;
  public onlyCalledMethods: boolean;
  public noColors: boolean;
  public excludeContracts: string[];

  // Output
  public outputFile: string | null;
  public rst: boolean;
  public rstTitle: string;

  // Contracts
  public solcConfig: SolcConfig | undefined;
  public srcPath: string;
  public proxyResolver: Function;

  constructor(options: HardhatGasReporterOptions = {}) {
    this.token = options.token || "ETH";
    this.defaultGasPrice = 5;
    this.blockLimit = options.blockLimit || 5_000_000;
    this.currency = options.currency || "eur";
    this.gasPriceApi =
      options.gasPriceApi ||
      "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice";
    this.coinmarketcap = options.coinmarketcap || null;
    this.ethPrice = options.ethPrice || null;
    this.gasPrice = options.gasPrice || null;
    this.outputFile = options.outputFile || null;
    this.rst = options.rst || false;
    this.rstTitle = options.rstTitle || "";
    this.srcPath = options.src || "contracts";
    this.noColors = options.noColors || false;
    this.proxyResolver = options.proxyResolver || null;
    this.showMethodSig = options.showMethodSig || false;

    // this.maxMethodDiff = options.maxMethodDiff;
    // this.maxDeploymentDiff = options.maxDeploymentDiff;

    this.excludeContracts = Array.isArray(options.excludeContracts)
      ? options.excludeContracts
      : [];

    this.onlyCalledMethods = options.onlyCalledMethods === false ? false : true;
  }
}
