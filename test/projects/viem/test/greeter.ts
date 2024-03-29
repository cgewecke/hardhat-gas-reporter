/* eslint-disable import/no-extraneous-dependencies */
import { assert, expect, use } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import chaiAsPromised  from "chai-as-promised";
import { viem } from "hardhat";

use(chaiAsPromised);

describe("Greeter contract", function() {
  async function deployGreeterFixture() {
    const publicClient = await viem.getPublicClient();
    const [owner, other] = await viem.getWalletClients();

    const deployGreeter = (args: [_greeting: string]) => viem.deployContract("Greeter", args);

    const greeter = await deployGreeter(["Hi"]);
    const emphaticGreeter = await viem.deployContract("EmphaticGreeter");

    const greeterAsOther = await viem.getContractAt(
      "Greeter",
      greeter.address,
      { client: { wallet: other  } }
    );

    return {
      publicClient,
      owner,
      other,
      deployGreeter,
      greeter,
      emphaticGreeter,
      greeterAsOther,
    }
  }

  it("Should shoud be deployable with different greetings", async function() {
    const {
      greeter,
      deployGreeter,
    } = await loadFixture(deployGreeterFixture);
    assert.equal(await greeter.read.greeting(), "Hi");
    const greeter2 = await deployGreeter(["Hola"]);
    assert.equal(await greeter2.read.greeting(), "Hola");
  });

  it("Should return the greeting when greet is called", async function() {
    const {
      greeter,
    } = await loadFixture(deployGreeterFixture);
    assert.equal(await greeter.read.greet(), "Hi");
  });

  it("Should set a greeting", async function(){
    const {
      greeter,
    } = await loadFixture(deployGreeterFixture);
    await greeter.write.setGreeting(['ciao']);
    assert.equal(await greeter.read.greet(), "ciao");
  })

  // NOTE: This test is to check whether gas reporter can catch calls from viem using
  // other accounts. Expected to see an entry in the method data for `asOther`
  it("Should call as other", async function(){
    const {
      greeterAsOther,
    } = await loadFixture(deployGreeterFixture);
    await greeterAsOther.write.asOther();
  })

  it("should revert with a message", async function(){
    const {
      greeterAsOther,
    } = await loadFixture(deployGreeterFixture);
    await expect(
      greeterAsOther.write.throwAnError(['throwing...'])
    ).to.eventually.be.rejectedWith('throwing...');
  })

  it("should call an inherited public state variable", async function() {
    const {
      greeter,
      emphaticGreeter,
    } = await loadFixture(deployGreeterFixture);

    await greeter.read.urGreeting();
    await emphaticGreeter.read.urGreeting()
  });
});
