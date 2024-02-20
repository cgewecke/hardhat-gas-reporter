// eslint-disable-next-line import/no-extraneous-dependencies
import { assert } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("VariableCosts", function() {
  const one = [1];
  const three = [2, 3, 4];
  const five = [5, 6, 7, 8, 9];
  let instance: Contract;
  let walletB: any;

  beforeEach(async () => {
    const VariableCosts = await ethers.getContractFactory("VariableCosts");
    const Wallet = await ethers.getContractFactory("Wallet");
    instance = await VariableCosts.deploy();
    walletB = await Wallet.deploy();
  });

  it("should add one", async () => {
    await instance.functions.addToMap(one);
  });

  it("should add three", async () => {
    await instance.functions.addToMap(three);
  });

  it("should add even 5!", async () => {
    await instance.functions.addToMap(five);
  });

  it("should delete one", async () => {
    await instance.functions.removeFromMap(one);
  });

  it("should delete three", async () => {
    await instance.functions.removeFromMap(three);
  });

  it("should delete five", async () => {
    await instance.functions.removeFromMap(five);
  });

  it("should add five and delete one", async () => {
    await instance.functions.addToMap(five);
    await instance.functions.removeFromMap(one);
  });

  it("methods that do not throw", async () => {
    await instance.functions.methodThatThrows(false);
  });

  it("methods that throw", async () => {
    try {
      await instance.functions.methodThatThrows(true);
    } catch (e) {}
  });

  it("methods that call methods in other contracts", async () => {
    await instance.functions.otherContractMethod();
  });

  // VariableCosts is Wallet. We also have Wallet tests. So we should see
  // separate entries for `sendPayment` / `transferPayment` under VariableCosts
  // and Wallet in the report
  it("should allow contracts to have identically named methods", async () => {
    await instance.fallback({
      value: 100,
    });
    await instance.functions.sendPayment(50, walletB.address, {
      // from: accounts[0].address
    });
    await instance.functions.transferPayment(50, walletB.address, {
      // from: accounts[0].address
    });
    const balance = await walletB.getBalance();
    assert.equal(parseInt(balance.toString()), 100);
  });
});
