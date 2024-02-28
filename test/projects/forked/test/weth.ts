import { ethers } from "hardhat";

describe("WETH contract", function () {
  it("should deposit weth", async function () {
    const WETH = await ethers.getContractAt(
      "WETH9",
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    );

    await WETH.deposit({ value: ethers.parseEther("1.0") });
  });
});
