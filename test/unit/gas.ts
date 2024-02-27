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

    it ("calculates cost for function call", function(){
      const fn = evmCases.function_1;

      const options: GasReporterOptions = {
        gasPrice: fn.gasPrice,
        tokenPrice: "1",
        currencyDisplayPrecision: precision
      };

      const cost = gasToCost(fn.gas, 0, options);
      assert(cost, fn.txFeeETH.toFixed(precision));
    })

    it ("calculates cost for deployment", function(){
      const fn = evmCases.deployment;

      const options: GasReporterOptions = {
        gasPrice: fn.gasPrice,
        tokenPrice: "1",
        currencyDisplayPrecision: precision
      };

      const cost = gasToCost(fn.gas, 0, options);
      assert(cost, fn.txFeeETH.toFixed(precision));
    })
});

describe("Optimism: getCalldataCostForNetwork", function () {
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
