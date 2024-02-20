// eslint-disable-next-line import/no-extraneous-dependencies
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

  it("should should allow transfers and sends", async () => {
    await walletA.fallback({ value: 100 });
    await walletA.functions.sendPayment(50, walletB.address);
    await walletA.functions.transferPayment(50, walletB.address);
    const balance = await walletB.functions.getBalance();
    assert.equal(parseInt(balance.toString()), 100);
  });
});
