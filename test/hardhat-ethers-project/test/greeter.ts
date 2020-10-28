// @ts-nocheck
// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import 'hardhat'

describe("Greeter contract", function() {
  it("Should shoud be deployable with different greetings", async function() {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter1 = await Greeter.deploy("Hi");
    assert.equal(await greeter1.functions.greeting(), "Hi");

    const greeter2 = await Greeter.deploy("Hola");
    assert.equal(await greeter2.functions.greeting(), "Hola");
  });

  it("Should return the greeting when greet is called", async function() {
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter1 = await Greeter.deploy("Hi");

    assert.equal(await greeter1.functions.greet(), "Hi");
  });

  it("Should set a greeting", async function(){
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter1 = await Greeter.deploy("Hi");
    await greeter1.functions.setGreeting('ciao');
    assert.equal(await greeter1.functions.greet(), "ciao");
  })
});
