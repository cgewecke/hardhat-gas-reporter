// tslint:disable-next-line no-implicit-dependencies
import {
  TASK_TEST
} from "@nomiclabs/buidler/builtin-tasks/task-names";

import { assert } from "chai";
import { useEnvironment } from "./helpers";

describe("Gas Reporter", function() {

  describe("using truffle v5 plugin)", function() {
    useEnvironment(__dirname + "/buidler-truffle-project");

    it("tests without --gas flag", async function() {
      const result = await this.env.run(TASK_TEST, {testFiles: ['test/etherrouter.js']});
    });

    it("tests produce table with --reportGas flag", function() {
    });

    it("can use a reporterOption (alwaysRun=true)", function(){
    });

  });
});

