import { ethers } from "hardhat";

describe("VariableConstructor", function() {
  let VariableConstructor: any;

  before(async function(){
    VariableConstructor = await ethers.getContractFactory("VariableConstructor");
  })
  it("should should initialize with a short string", async () => {
    await VariableConstructor.deploy("Exit Visa");
  });

  it("should should initialize with a medium length string", async () => {
    await VariableConstructor.deploy("Enclosed is my application for residency");
  });

  it("should should initialize with a long string", async () => {
    let msg =
      "Enclosed is my application for permanent residency in NewZealand.";
    msg += "I am a computer programmer.";
    await VariableConstructor.deploy(msg);
  });
});
