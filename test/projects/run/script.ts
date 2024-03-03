/*
  MIT License
  Copyright (c) 2021 Yuichiro Aoki
  This test fixture adapted from https://github.com/yuichiroaoki/flash-swap-example
*/

/* eslint-disable import/no-extraneous-dependencies */
import type { Contract } from "ethers";
import { network, ethers } from "hardhat";

import * as IERC20 from "@openzeppelin/contracts/build/contracts/IERC20.json";

export const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
export const UNI = "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
export const DAI_WHALE = "0x60FaAe176336dAb62e284Fe19B885B095d29fB7F"
export const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"

export const SWAP_ROUTER = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
export const uniswapv3factory = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
export const KYBER_ADDRESS = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755"
export const weth9 = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

async function getErc20Balance(
	contract: Contract, address: string, decimals: number
): Promise<number> {

	const [balance] = await Promise.all([
		contract.balanceOf(address),
	])

	return parseFloat(ethers.formatUnits(balance, decimals))
}

async function fundErc20(
	contract: Contract, sender: string, recepient: string, amount: string
){

	const FUND_AMOUNT = ethers.parseUnits(amount, 18)

	// fund erc20 token to the contract
	const MrWhale = await ethers.getSigner(sender)

	const contractSigner = contract.connect(MrWhale)
	await (contractSigner as any).transfer(recepient, FUND_AMOUNT)
}

async function impersonateFundErc20(
	contract: Contract, sender: string, recepient: string, amount: string
) {
	await network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [sender],
	});

	// fund baseToken to the contract
	await fundErc20(contract, sender, recepient, amount)

	await network.provider.request({
		method: "hardhat_stopImpersonatingAccount",
		params: [sender],
	})
}

async function main(
	borrowingTokenAddress: string,
	swapingPairTokenAddress: string,
	isUniKyb: Boolean,
	amount: number
) {
	const FlashSwaps = await ethers.getContractFactory("FlashSwaps");
	const [deployer] = await ethers.getSigners();
	const provider = ethers.provider;

	const flashswaps = await FlashSwaps.deploy(
		SWAP_ROUTER,
		uniswapv3factory,
		ethers.getAddress(weth9),
		KYBER_ADDRESS
	);

	const DECIMALS = 18

	// let swapingPairToken: any;
	// let borrowingToken: any;
	// swapingPairToken = new ethers.Contract(swapingPairTokenAddress, IERC20.abi, provider)
	const borrowingToken = new ethers.Contract(borrowingTokenAddress, IERC20.abi, provider)

	await impersonateFundErc20(
    borrowingToken,
    DAI_WHALE,
    await flashswaps.getAddress(),
    "2000.0"
  );

	const initialBalance = await getErc20Balance(borrowingToken, deployer.address, DECIMALS)
	console.log("deployer's initial balance", initialBalance)

	// borrow from token0, token1 fee1 pool
	await flashswaps.initFlash({
		token0: ethers.getAddress(borrowingTokenAddress), // DAI
		token1: ethers.getAddress(USDC),
		token2: ethers.getAddress(swapingPairTokenAddress), // UNI
		fee1: 500,
		amount0: ethers.parseUnits(amount.toString(), DECIMALS),
		amount1: 0,
		fee2: 500,
		unikyb: isUniKyb,
	})

	const endingBalance = await getErc20Balance(borrowingToken, deployer.address, DECIMALS)
	console.log("deployer's ending balance", endingBalance)

	const profit = endingBalance - initialBalance

	// if (profit>0) {
		console.log(`Congrats! You earned ${profit} DAI !!`)
	// }
}

main(DAI, UNI, false, 1500)
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
