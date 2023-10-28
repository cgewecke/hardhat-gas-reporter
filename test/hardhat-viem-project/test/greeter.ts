// @ts-nocheck
// tslint:disable-next-line no-implicit-dependencies
import { assert, expect, use } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { viem } from "hardhat";
import chaiAsPromised  from "chai-as-promised";

use(chaiAsPromised);

describe("Greeter contract", function() {
  async function deployGreeterFixture() {
    const publicClient = await viem.getPublicClient();
    const [owner, other] = await viem.getWalletClients();

    const deployGreeter = (args: [_greeting: string]) => viem.deployContract("Greeter", args);

    const greeter = await deployGreeter(["Hi"]);

    const greeterAsOther = await viem.getContractAt(
      "Greeter",
      greeter.address,
      { walletClient: other }
    );

    return {
      publicClient,
      owner,
      other,
      deployGreeter,
      greeter,
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

  it("Should call as other", async function(){
    // NOTE: This test is to check whether gas reporter can catch calls from viem using other accounts.
    //        The result should be checked manually on the gas usage table.
    //        Expected to see a row for `asOther` method.
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
});
