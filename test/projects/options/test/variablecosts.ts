/* eslint-disable import/no-extraneous-dependencies */
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

  it("can call an empty view fn", async() => {
    await instance.callEmptyFn();
  });

  it("can call a pure fn", async() => {
    await instance.callPureFnReturn(5);
  });

  it("can call a reverting pure fn", async() => {
    try {
      await instance.callRevertingPureFn();
    } catch(e) { /* ignore */ }
  });

  it("can call a view fn", async() => {
    await instance.callViewFn(10);
  });

  it("should add one", async () => {
    await instance.addToMap(one);
  });

  it("should add three", async () => {
    await instance.addToMap(three);
  });

  it("should add even 5!", async () => {
    await instance.addToMap(five);
  });

  it("should delete one", async () => {
    await instance.removeFromMap(one);
  });

  it("should delete three", async () => {
    await instance.removeFromMap(three);
  });

  it("should delete five", async () => {
    await instance.removeFromMap(five);
  });

  it("should add five and delete one", async () => {
    await instance.addToMap(five);
    await instance.removeFromMap(one);
  });

  it("methods that do not throw", async () => {
    await instance.methodThatThrows(false);
  });

  it("methods that throw", async () => {
    try {
      await instance.methodThatThrows(true);
    } catch (e) {}
  });

  it("methods that call methods in other contracts", async () => {
    await instance.otherContractMethod();
  });

  // VariableCosts is Wallet. We also have Wallet tests. So we should see
  // separate entries for `sendPayment` / `transferPayment` under VariableCosts
  // and Wallet in the report
  it("should allow contracts to have identically named methods", async () => {
    await instance.fallback!({
      value: 100,
    });
    await instance.sendPayment(50, await walletB.getAddress(), {
      // from: accounts[0].address
    });
    await instance.transferPayment(50, await walletB.getAddress(), {
      // from: accounts[0].address
    });
    const balance = await walletB.getBalance();
    assert.equal(parseInt(balance.toString()), 100);
  });
});
