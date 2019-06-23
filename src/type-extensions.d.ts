import "@nomiclabs/buidler/types";

import { EthGasReporterConfig } from "./types";

declare module "@nomiclabs/buidler/types" {
  interface BuidlerConfig {
    gasReporter?: Partial<EthGasReporterConfig>;
  }
}
