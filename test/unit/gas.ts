// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { getCalldataGasForNetwork, gasToCost } from "../../src/utils/gas";
import { GasReporterOptions } from "../types";
import { cases as optimismCases } from "./cases/optimism";


function getPercentDiff(valA: number, valB: number) {
  return (valA > valB)
    ? (valA - valB) / valA
    : (valB - valA) / valB;
}

describe("getCalldataCostForNetwork", function () {
  it("calculates gas cost for small function call tx (bedrock", function () {
    const fn = optimismCases.bedrockFunction_1;

    const options: GasReporterOptions = {
      L2: "optimism",
      optimismHardfork: "bedrock",
      gasPrice: fn.l2GasPrice,
      baseFee: fn.l1BaseFee,
      tokenPrice: "1",
      currencyDisplayPrecision: 8,
    }

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual ~ 3.5%
    assert(diff < .05);
  });

  it("calculates gas cost for larger function call tx (bedrock)", function(){
    const fn = optimismCases.bedrockFunction_2;

    const options: GasReporterOptions = {
      L2: "optimism",
      optimismHardfork: "bedrock",
      gasPrice: fn.l2GasPrice,
      baseFee: fn.l1BaseFee,
      tokenPrice: "1",
      currencyDisplayPrecision: 8
    }

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual < 1%
    assert(diff < .05);
  });

  it("calculates gas cost for deployment tx (bedrock)", function(){
    const fn = optimismCases.bedrockDeployment;

    const options: GasReporterOptions = {
      L2: "optimism",
      optimismHardfork: "bedrock",
      gasPrice: fn.l2GasPrice,
      baseFee: fn.l1BaseFee,
      tokenPrice: "1",
      currencyDisplayPrecision: 8
    }

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual < 1%
    assert(diff < .05);
  });
});
