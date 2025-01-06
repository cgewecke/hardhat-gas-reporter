/* eslint-disable import/no-extraneous-dependencies */
import { assert } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Wallet", function() {
  let walletA: Contract;
  let walletB: Contract;

  before(async function() {
    const Wallet = await ethers.getContractFactory("Wallet");
    walletA = await Wallet.deploy();
    walletB = await Wallet.deploy();
  });

  it("should allow transfers and sends", async () => {
    await walletA.fallback!({ value: 100 });
    await walletA.sendPayment(50, await walletB.getAddress());
    await walletA.transferPayment(50, await walletB.getAddress());
    const balance = await walletB.getBalance();
    assert.equal(parseInt(balance.toString()), 100);
  });
});
