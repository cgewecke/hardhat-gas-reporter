// eslint-disable-next-line import/no-extraneous-dependencies
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("Factory deployment: different contract / same method name", function () {
  let Factory;
  let VersionA;
  let VersionB;
  let factory: Contract;
  let versionA: Contract;
  let versionB: Contract;

  before(async function () {
    Factory = await ethers.getContractFactory("Factory");
    VersionA = await ethers.getContractFactory("VersionA");
    VersionB = await ethers.getContractFactory("VersionB");

    factory = await Factory.deploy();

    await factory.deployVersionA();
    versionA = VersionA.attach(await factory.versionA());

    await factory.deployVersionB();
    versionB = VersionB.attach(await factory.versionB());
  });

  it("Calling both versionA.setValue and versionB.setValue", async function () {
    await versionA.setValue();
    await versionB.setValue();
  });
});
