import { ethers } from "hardhat";

describe("Immutable", function() {
  let a: any;

  before(async function() {
    const Immutable = await ethers.getContractFactory("Immutable");

    a = await Immutable.deploy(5);
  });

  it("a and b", async function() {
    await a.functions.setVal(5);
  });
});
