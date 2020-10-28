import "hardhat/types";

import { EthGasReporterConfig } from "./types";

declare module "hardhat/types" {
  interface HardhatUserConfig {
    gasReporter?: Partial<EthGasReporterConfig>;
  }
}
