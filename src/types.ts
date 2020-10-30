export interface EthGasReporterConfig {
  currency?: string;
  gasPrice?: number;
  coinmarketcap?: string;
  outputFile?: string;
  noColors?: boolean;
  onlyCalledMethods?: boolean;
  rst?: boolean;
  rstTitle?: boolean;
  showTimeSpent?: boolean;
  excludeContracts?: string[];
  src?: string;
  proxyResolver?: any;
  showMethodSig?: boolean;
  maxMethodDiff?: number;
  maxDeploymentDiff?: number;

  // Hardhat (required)
  enabled: boolean;
  metadata: any;
  getContracts: any;
  url: string;
  fast?: boolean;
}
