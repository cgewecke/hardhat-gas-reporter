import { ethers } from "hardhat";

describe("VariableConstructor", function() {
  let VariableConstructor: any;
  const short = "s";
  const medium = process.env.GAS_DELTA === "true"
    ? "medium_length_initializer"
    : "medium_length_initializerrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr";

  const long = "looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong_initializer";

  before(async function(){
    VariableConstructor = await ethers.getContractFactory("VariableConstructor");
  })

  it("should should initialize with a short string", async () => {
    await VariableConstructor.deploy(short);
  });

  it("should should initialize with a medium length string", async () => {
    await VariableConstructor.deploy(medium);
  });

  it("should should initialize with a long string", async () => {
    await VariableConstructor.deploy(long);
  });
});
