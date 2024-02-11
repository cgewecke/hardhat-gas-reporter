// @ts-nocheck
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import 'hardhat'

describe("WETH contract", function() {
  it("should deposit weth", async function() {
    const signers = await ethers.getSigners();
    const WETH = await ethers.getContractAt("WETH9", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await WETH.deposit({value: ethers.utils.parseEther("1.0")});
  });
});
