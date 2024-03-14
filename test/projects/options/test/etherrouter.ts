// eslint-disable-next-line import/no-extraneous-dependencies
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("EtherRouter Proxy", function() {
  let Router;
  let Resolver;
  let Factory;
  let VersionA;
  let VersionB;
  let router: Contract;
  let resolver: Contract;
  let factory: Contract;
  let versionA: Contract;
  let versionB: Contract;

  before(async function() {
    Router = await ethers.getContractFactory("EtherRouter");
    Resolver = await ethers.getContractFactory("Resolver");
    Factory = await ethers.getContractFactory("Factory");
    VersionA = await ethers.getContractFactory("VersionA");
    VersionB = await ethers.getContractFactory("VersionB");

    router = await Router.deploy();
    resolver = await Resolver.deploy();
    factory = await Factory.deploy();
    versionA = await VersionA.deploy();

    // Emulate internal deployment
    await factory.deployVersionB();
    const versionBAddress = await factory.versionB();
    versionB = VersionB.attach(versionBAddress);
  });

  it("Resolves methods routed through an EtherRouter proxy", async function() {
    const options: any = {};

    await router.setResolver(await resolver.getAddress());

    await resolver.register("setValue()", await versionA.getAddress());
    options.data = versionA.interface.encodeFunctionData("setValue");
    await router.fallback!(options);

    await resolver.register("setValue()", await versionB.getAddress());
    options.data = versionB.interface.encodeFunctionData("setValue");
    await router.fallback!(options);
  });
});
