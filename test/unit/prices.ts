// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import {
  setGasAndPriceRates
} from "../../src/utils/prices";
import { getDefaultOptions } from "../../src/lib/options";
import { GasReporterOptions } from "../types";


describe("setGasAndPriceRates", function(){
  let options: GasReporterOptions;

  beforeEach(() => {
    options = getDefaultOptions({});
  });

  it ("when tokenPrice and gasPrice are both set", async function(){
    const initialTokenPrice = "1";
    const initialGasPrice = 1;
    options.tokenPrice = initialTokenPrice;
    options.gasPrice = initialGasPrice;

    await setGasAndPriceRates(options);

    assert.equal(options.tokenPrice, initialTokenPrice);
    assert.equal(options.gasPrice, initialGasPrice);
  })

  it ("when coinmarketcap is not set", async function() {
    assert.isUndefined(options.tokenPrice);
    assert.isUndefined(options.gasPrice);

    await setGasAndPriceRates(options);

    assert.isUndefined(options.tokenPrice);
    assert.isUndefined(options.gasPrice);
  });

  it ("when offline is true", async function(){
    assert.isUndefined(options.tokenPrice);
    assert.isUndefined(options.gasPrice);

    options.coinmarketcap = process.env.CMC_API_KEY;
    options.offline = true;

    await setGasAndPriceRates(options);

    assert.isUndefined(options.tokenPrice);
    assert.isUndefined(options.gasPrice);
  });

  it ("when tokenPrice but not gasPrice is set", async function() {
    const initialTokenPrice = "1";

    options.tokenPrice = initialTokenPrice;
    options.coinmarketcap = process.env.CMC_API_KEY;
    options.L1Etherscan = process.env.ETHERSCAN_API_KEY;

    assert.isUndefined(options.gasPrice);

    await setGasAndPriceRates(options);

    assert.equal(options.tokenPrice, initialTokenPrice);
    assert.isDefined(options.gasPrice);
    assert.typeOf(options.gasPrice, "number");
  });

  it ("when gasPrice but not tokenPrice is set", async function(){
    const initialGasPrice = 1;
    options.gasPrice = initialGasPrice;
    options.coinmarketcap = process.env.CMC_API_KEY;

    assert.isUndefined(options.tokenPrice);

    await setGasAndPriceRates(options);

    assert.equal(options.gasPrice, initialGasPrice);
    assert.isDefined(options.tokenPrice);
    assert.typeOf(options.tokenPrice, "string");
  });

  it("when tokenPrice and gasPrice are set but baseFee is not set", async function(){
    options.tokenPrice = "1";
    options.gasPrice = 1;
    options.L2 = 'optimism';
    options.coinmarketcap = process.env.CMC_API_KEY;
    options.L2Etherscan = process.env.OPTIMISTIC_API_KEY;

    assert.isUndefined(options.baseFee);

    await setGasAndPriceRates(options);

    assert.isDefined(options.baseFee);
    assert.typeOf(options.baseFee, "number");
  });

  it ("when tokenPrice, gasPrice and baseFee are set but blobBaseFee is not set", async function(){
    options.tokenPrice = "1";
    options.gasPrice = 1;
    options.baseFee = 1;
    options.L2 = 'optimism';
    options.coinmarketcap = process.env.CMC_API_KEY;
    options.L2Etherscan = process.env.OPTIMISTIC_API_KEY;

    assert.isUndefined(options.blobBaseFee);

    await setGasAndPriceRates(options);

    assert.isDefined(options.blobBaseFee);
    assert.typeOf(options.blobBaseFee, "number");
  });
});
