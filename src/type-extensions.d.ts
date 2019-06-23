import "@nomiclabs/buidler/types";

import { GasReporterConfig } from "./types";

declare module "@nomiclabs/buidler/types" {
  interface BuidlerConfig {
    gasReporter?: Partial<GasReporterConfig>;
  }
}
