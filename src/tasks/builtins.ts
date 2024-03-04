import {
  TASK_TEST,
  // TASK_RUN
} from "hardhat/builtin-tasks/task-names";

import { task } from "hardhat/config";
import {
  TASK_GAS_REPORTER_START,
  TASK_GAS_REPORTER_STOP
} from "../constants"


/**
 * Overrides Hardhat built-in task TASK_TEST to report gas usage
 */
task(TASK_TEST).setAction(
  async (args: any, hre, runSuper) => {
    hre.__hhgrec.task = TASK_TEST;
    await hre.run(TASK_GAS_REPORTER_START, args);
    await runSuper(args);
    await hre.run(TASK_GAS_REPORTER_STOP, args);
  }
);

/**
 * Overrides Hardhat built-in task TASK_RUN to report gas usage
 */
/* task(TASK_RUN).setAction(
  async (args: any, hre, runSuper) => {
    hre.__hhgrec.task = TASK_RUN;
    await hre.run(TASK_GAS_REPORTER_START, args);
    await runSuper(args);
    await hre.run(TASK_GAS_REPORTER_STOP, args);
  }
);*/
