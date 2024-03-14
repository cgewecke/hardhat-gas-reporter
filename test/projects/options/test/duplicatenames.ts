import { ethers } from "hardhat";

describe("Duplicate contract names", function() {
  let DuplicateA: any;
  let DuplicateB: any;

  before(async function(){
    DuplicateA = await ethers.getContractFactory("contracts/DuplicateA.sol:Duplicate");
    DuplicateB = await ethers.getContractFactory("contracts/DuplicateB.sol:Duplicate");
  });

  it("a", async function() {
    const d = await DuplicateA.deploy();
    await d.a();
  });

  it("b", async function() {
    const d = await DuplicateB.deploy();
    await d.b();
  });
});
