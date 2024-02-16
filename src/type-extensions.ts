import { GasReporterOptions, GasReporterExecutionContext } from "./types";

/* Type Extensions */
declare module "hardhat/types/config" {
  interface HardhatConfig {
    gasReporter: Partial<GasReporterOptions>;
  }
}

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    gasReporter?: Partial<GasReporterOptions>;
  }
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __hhgrec: GasReporterExecutionContext
  }
}
