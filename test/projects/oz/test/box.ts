import { ethers, upgrades } from "hardhat";

// Tests adapted from OZ Hardhat plugin documentation examples
describe("Box", function() {
  it('uses a method shadowed by an upgrade (Proxy)', async function() {
    const ProxyBox = await ethers.getContractFactory("ProxyBox");
    const ProxyBoxV2 = await ethers.getContractFactory("ProxyBoxV2");

    const instance = await upgrades.deployProxy(ProxyBox, []);
    await instance.setBox('hello');

    const upgraded = await upgrades.upgradeProxy(await instance.getAddress(), ProxyBoxV2);
    await upgraded.setBox('hello again');
  });

  it('uses a method shadowed by an upgrade (Beacon)', async function () {
    const BeaconBox = await ethers.getContractFactory("BeaconBox");
    const BeaconBoxV2 = await ethers.getContractFactory("BeaconBoxV2");

    const beacon = await upgrades.deployBeacon(BeaconBox);
    const instance = await upgrades.deployBeaconProxy(beacon, BeaconBox);

    await instance.setBox('hello');

    await upgrades.upgradeBeacon(beacon, BeaconBoxV2);
    const upgraded = BeaconBoxV2.attach(await instance.getAddress());

    await upgraded.setBox('hello again');
    await upgraded.setBeaconId(5);
  });
});

