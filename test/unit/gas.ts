// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import {
  getCalldataGasForNetwork,
  gasToPercentOfLimit,
  gasToCost
} from "../../src/utils/gas";
import { GasReporterOptions } from "../types";
import {
  BASE_ECOTONE_BASE_FEE_SCALAR,
  BASE_ECOTONE_BLOB_BASE_FEE_SCALAR,
  OPTIMISM_ECOTONE_BASE_FEE_SCALAR,
  OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR
} from "../../src/constants";
import { cases as arbitrumCases } from "./cases/arbitrum";
import { cases as baseCases } from "./cases/base";
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
    tokenPrice: "1",
    currencyDisplayPrecision: 8,
    opStackBaseFeeScalar: OPTIMISM_ECOTONE_BASE_FEE_SCALAR,
    opStackBlobBaseFeeScalar: OPTIMISM_ECOTONE_BLOB_BASE_FEE_SCALAR
  }

  it("calculates gas cost for small function call tx (bedrock)", function () {
    const fn = optimismCases.bedrockFunction_1;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;
    options.optimismHardfork = "bedrock";

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
    options.optimismHardfork = "bedrock";

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
    options.optimismHardfork = "bedrock";

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual < 0.06%
    assert(diff < .01);
  });
  it("calculates gas cost for small function call tx (ecotone)", function () {
    const fn = optimismCases.ecotoneFunction_1;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;
    options.blobBaseFee = fn.l1BlobBaseFee;
    options.optimismHardfork = "ecotone";

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // actual 0.013
    assert(diff < .015);
  });

  it("calculates gas cost for large function call tx (ecotone) (I)", function () {
    const fn = optimismCases.ecotoneFunction_2;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;
    options.blobBaseFee = fn.l1BlobBaseFee;
    options.optimismHardfork = "ecotone";

    const gas = getCalldataGasForNetwork(options, fn.tx);;
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // actual 0.0105
    assert(diff < .015);
  });

  it("calculates gas cost for large function call tx (ecotone) (II)", function () {
    const fn = optimismCases.ecotoneFunction_3;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;
    options.blobBaseFee = fn.l1BlobBaseFee;
    options.optimismHardfork = "ecotone";

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // actual 0.0008
    assert(diff < .015);
  });
});

describe("Base: getCalldataCostForNetwork", function () {
  const options: GasReporterOptions = {
    L2: "base",
    tokenPrice: "1",
    currencyDisplayPrecision: 8,
    optimismHardfork: "ecotone",
    opStackBaseFeeScalar: BASE_ECOTONE_BASE_FEE_SCALAR,
    opStackBlobBaseFeeScalar: BASE_ECOTONE_BLOB_BASE_FEE_SCALAR
  }

  it("calculates gas cost for function call tx (ecotone)", function () {
    const fn = baseCases.ecotoneFunction_1;
    options.gasPrice = fn.l2GasPrice;
    options.baseFee = fn.l1BaseFee;
    options.blobBaseFee = fn.l1BlobBaseFee;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual ~ 0.0005
    assert(diff < .01);
  });
});

describe("Arbitrum: getCalldataCostForNetwork", function () {
  const options: GasReporterOptions = {
    L2: "arbitrum",
    tokenPrice: "1",
    currencyDisplayPrecision: 8,
  }

  it("calculates gas cost for function call tx", function () {
    const fn = arbitrumCases.arbOSFunction_1;
    options.gasPrice = fn.l2GasPrice;
    options.baseFeePerByte = fn.l1BaseFeePerByte;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual ~ 0.07
    assert(diff < .1);
  });

  it("calculates gas cost for function call tx", function () {
    const fn = arbitrumCases.arbOSFunction_2;
    options.gasPrice = fn.l2GasPrice;
    options.baseFeePerByte = fn.l1BaseFeePerByte;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual ~ 0.01
    assert(diff < .1);
  });

  it("calculates gas cost for a deployment tx", function () {
    const fn = arbitrumCases.arbOSDeployment_1;
    options.gasPrice = fn.l2GasPrice;
    options.baseFeePerByte = fn.l1BaseFeePerByte;

    const gas = getCalldataGasForNetwork(options, fn.tx);
    const cost = gasToCost(fn.l2GasUsed, gas, options);
    const diff = getPercentDiff(parseFloat(cost), fn.txFeeETH);

    // Actual ~ 0.089
    assert(diff < .1);
  });
});
