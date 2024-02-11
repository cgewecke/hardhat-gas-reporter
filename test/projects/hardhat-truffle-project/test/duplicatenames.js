const DuplicateA = artifacts.require("contracts/DuplicateA.sol:Duplicate");
const DuplicateB = artifacts.require("contracts/DuplicateB.sol:Duplicate");

contract("Duplicate contract names", function(accounts) {
  it("a", async function() {
    const d = await DuplicateA.new();
    await d.a();
  });

  it("b", async function() {
    const d = await DuplicateB.new();
    await d.b();
  });
})