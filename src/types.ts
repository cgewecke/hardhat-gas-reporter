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
  artifactType?: "truffle-v5" | "0xProject-v2" | "buidler-v1" | "ethpm";
  url: string;
  fast?: boolean;
}
