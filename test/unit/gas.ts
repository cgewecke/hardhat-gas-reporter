// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import {
  getCalldataGasForNetwork,
  gasToPercentOfLimit,
  gasToCost
} from "../../src/utils/gas";
import { GasReporterOptions } from "../types";
import { cases as optimismCases } from "./cases/optimism";
import { cases as evmCases } from "./cases/evm";


function getPercentDiff(valA: number, valB: number) {
  return (valA > valB)
    ? (valA - valB) / valA
    : (valB - valA) / valB;
}

describe("gasToPercentOfLimit", function(){
  it ("calculates the percentage as a number btw 0 and 100", function() {
    const gas = 350_000;
    const limit = 700_000;

    const percent = gasToPercentOfLimit(gas, limit);
    assert.equal(percent, 50);
  });
});

describe("EVM L1: gasToCost", function() {
    const precision = 7;
    const options: GasReporterOptions = {
      tokenPrice: "1",
      currencyDisplayPrecision: precision
    }

    it ("calculates cost for function call", function(){
      const fn = evmCases.function_1;
      options.gasPrice = fn.gasPrice;
      const cost = gasToCost(fn.gas, 0, options);

      assert(cost, fn.txFeeETH.toFixed(precision));
    })

    it ("calculates cost for deployment", function(){
      const fn = evmCases.deployment;
      options.gasPrice = fn.gasPrice;
      const cost = gasToCost(fn.gas, 0, options);

      assert(cost, fn.txFeeETH.toFixed(precision));
    })
});

describe("Optimism: getCalldataCostForNetwork", function () {
  const options: GasReporterOptions = {
    L2: "optimism",
    optimismHardfork: "bedrock",
    tokenPrice: "1",
    currencyDisplayPrecision: 8,
  }

  it("calculates gas cost for small function call tx (bedrock", function () {
    const fn = optimismCases.bedrockFunction_1;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual ~ 0.72%
    assert(diff < .01);
  });

  it("calculates gas cost for larger function call tx (bedrock)", function(){
    const fn = optimismCases.bedrockFunction_2;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual < 0.15%
    assert(diff < .01);
  });

  it("calculates gas cost for deployment tx (bedrock)", function(){
    const fn = optimismCases.bedrockDeployment;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual < 0.06%
    assert(diff < .01);
  });
});
