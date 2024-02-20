import { Contract } from "ethers";
import { network, ethers } from "hardhat";

describe("contractA", function() {
  let instance: Contract;
  let startBlockNumber: number;

  before(async () => {
    startBlockNumber = await ethers.provider.getBlockNumber();
  });
  beforeEach(async () => {
    await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            forking: {
              jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_TOKEN!}`,
              blockNumber: startBlockNumber,
            },
          },
        ],
      });

    const factory = await ethers.getContractFactory("ContractA");
    instance = await factory.deploy();
  });

  it('sends', async function(){
    await instance.sendFn();
  });

  it('sends again', async function(){
    await instance.sendFn();
  });
});
