import { ethers } from "hardhat";

describe("MultiContractFiles", function() {
  let a: any;
  let b: any;

  before(async function() {
    const MultiContractFileA = await ethers.getContractFactory("MultiContractFileA");
    const MultiContractFileB = await ethers.getContractFactory("MultiContractFileB");

    a = await MultiContractFileA.deploy();
    b = await MultiContractFileB.deploy();
  });

  it("a and b", async function() {
    await a.functions.hello();
    await b.functions.goodbye();
  });
});
