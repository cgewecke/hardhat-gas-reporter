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

  // Buidler (required)
  enabled: boolean;
  metadata: any;
  artifactType: any;
  url: string;
  fast?: boolean;
}
