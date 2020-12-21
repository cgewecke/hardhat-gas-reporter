// @ts-nocheck
// tslint:disable-next-line no-implicit-dependencies
import { assert, expect } from "chai";
import { ethers, waffle } from "hardhat";

describe("Greeter contract", function() {
  let Greeter;
  let greeter1;
  let owner, addr1;

  beforeEach(async function(){
    [owner, addr1] = await waffle.provider.getWallets();
    Greeter = await ethers.getContractFactory("Greeter");
    greeter1 = await Greeter.deploy("Hi");
  });

  it("Should shoud be deployable with different greetings", async function() {
    assert.equal(await greeter1.greeting(), "Hi");
    const greeter2 = await Greeter.deploy("Hola");
    assert.equal(await greeter2.greeting(), "Hola");
  });

  it("Should return the greeting when greet is called", async function() {
    assert.equal(await greeter1.greet(), "Hi");
  });

  it("Should set a greeting", async function(){
    await greeter1.connect(addr1).setGreeting('ciao');
    assert.equal(await greeter1.greet(), "ciao");
  })

  it("should revert with a message", async function(){
    await expect(
      greeter1.connect(addr1).throwAnError('throwing...')
    ).to.be.revertedWith('throwing...');
  })
});
