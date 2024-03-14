// SPDX-License-Identifier: GPL-2.0-or-later
// Copyright (c) 2021 Yuichiro Aoki
// This test fixture adapted from https://github.com/yuichiroaoki/flash-swap-example
pragma solidity =0.7.6;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3FlashCallback.sol";
import "@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol";

import {KyberNetworkProxy as IKyberNetworkProxy} from "./KyberNetworkProxy.sol";
import "@uniswap/v3-periphery/contracts/base/PeripheryPayments.sol";
import "@uniswap/v3-periphery/contracts/base/PeripheryImmutableState.sol";
import "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol";
import "@uniswap/v3-periphery/contracts/libraries/CallbackValidation.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./Base.sol";

contract FlashSwaps is
    IUniswapV3FlashCallback,
    PeripheryImmutableState,
    PeripheryPayments,
    Base
{
    using LowGasSafeMath for uint256;
    using LowGasSafeMath for int256;

    IKyberNetworkProxy kyber;
    ISwapRouter public immutable swapRouter;
    address internal WETH;

    constructor(
        ISwapRouter _swapRouter,
        address _factory,
        address _WETH9,
        address kyberAddress
    ) PeripheryImmutableState(_factory, _WETH9) {
        swapRouter = _swapRouter;
        kyber = IKyberNetworkProxy(kyberAddress);
        WETH = _WETH9;
    }

    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external override {
        FlashCallbackData memory decoded = abi.decode(
            data,
            (FlashCallbackData)
        );
        CallbackValidation.verifyCallback(factory, decoded.poolKey);

        address token0 = decoded.poolKey.token0;
        address token1 = decoded.poolKey.token1;

        if (decoded.unikyb) {
            uint256 amountOut0 = swapOnUniswap(
                decoded.amount0,
                token0,
                decoded.target,
                decoded.poolFee2
            );

            uint256 amountOut1 = swapOnKyber(
                amountOut0,
                decoded.target,
                token0
            );

            payback(
                decoded.amount0,
                decoded.amount1,
                fee0,
                fee1,
                token0,
                token1,
                amountOut1,
                decoded.payer
            );
        } else {
            uint256 amountOut0 = swapOnKyber(
                decoded.amount0,
                token0,
                decoded.target
            );

            uint256 amountOut1 = swapOnUniswap(
                amountOut0,
                decoded.target,
                token0,
                decoded.poolFee2
            );

            payback(
                decoded.amount0,
                decoded.amount1,
                fee0,
                fee1,
                token0,
                token1,
                amountOut1,
                decoded.payer
            );
        }
    }

    function payback(
        uint256 amount0,
        uint256 amount1,
        uint256 fee0,
        uint256 fee1,
        address token0,
        address token1,
        uint256 amountOut1,
        address payer
    ) internal {
        uint256 amount0Owed = LowGasSafeMath.add(amount0, fee0);
        uint256 amount1Owed = LowGasSafeMath.add(amount1, fee1);

        TransferHelper.safeApprove(token0, address(this), amount0Owed);
        TransferHelper.safeApprove(token1, address(this), amount1Owed);

        if (amount0Owed > 0)
            pay(token0, address(this), msg.sender, amount0Owed);
        if (amount1Owed > 0)
            pay(token1, address(this), msg.sender, amount1Owed);

        if (amountOut1 > amount0Owed) {
            uint256 profit1 = LowGasSafeMath.sub(amountOut1, amount0Owed);
            TransferHelper.safeApprove(token0, address(this), profit1);
            pay(token0, address(this), payer, profit1);
        }
    }

    function swapOnUniswap(
        uint256 amountIn,
        address inputToken,
        address outputToken,
        uint24 poolFee
    ) internal returns (uint256 amountOut) {
        TransferHelper.safeApprove(inputToken, address(swapRouter), amountIn);

        if (inputToken == WETH || outputToken == WETH) {
            amountOut = swapRouter.exactInputSingle(
                ISwapRouter.ExactInputSingleParams({
                    tokenIn: inputToken,
                    tokenOut: outputToken,
                    fee: poolFee,
                    recipient: address(this),
                    deadline: block.timestamp + 200,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                })
            );
        } else {
            ISwapRouter.ExactInputParams memory params = ISwapRouter
                .ExactInputParams({
                    path: abi.encodePacked(
                        inputToken,
                        poolFee,
                        WETH,
                        poolFee,
                        outputToken
                    ),
                    recipient: address(this),
                    deadline: block.timestamp + 200,
                    amountIn: amountIn,
                    amountOutMinimum: 0
                });

            amountOut = swapRouter.exactInput(params);
        }
    }

    function swapOnKyber(
        uint256 amountIn,
        address inputToken,
        address outputToken
    ) internal returns (uint256 amountOut) {
        (uint256 expectedRate, ) = kyber.getExpectedRate(
            IERC20(inputToken),
            IERC20(outputToken),
            amountIn
        );

        TransferHelper.safeApprove(inputToken, address(kyber), amountIn);
        try
            kyber.swapTokenToToken(
                IERC20(inputToken),
                amountIn,
                IERC20(outputToken),
                expectedRate
            )
        returns (uint256 bal) {
            amountOut = bal;
        } catch {
            revert("KE");
        }
    }

    struct FlashParams {
        address token0;
        address token1;
        address token2;
        uint24 fee1;
        uint256 amount0;
        uint256 amount1;
        uint24 fee2;
        bool unikyb;
    }
    struct FlashCallbackData {
        uint256 amount0;
        uint256 amount1;
        address target;
        address payer;
        PoolAddress.PoolKey poolKey;
        uint24 poolFee2;
        bool unikyb;
    }

    function initFlash(FlashParams memory params) external {
        PoolAddress.PoolKey memory poolKey = PoolAddress.PoolKey({
            token0: params.token0,
            token1: params.token1,
            fee: params.fee1
        });
        IUniswapV3Pool pool = IUniswapV3Pool(
            PoolAddress.computeAddress(factory, poolKey)
        );

        pool.flash(
            address(this),
            params.amount0,
            params.amount1,
            abi.encode(
                FlashCallbackData({
                    amount0: params.amount0,
                    amount1: params.amount1,
                    target: params.token2,
                    payer: msg.sender,
                    poolKey: poolKey,
                    poolFee2: params.fee2,
                    unikyb: params.unikyb
                })
            )
        );
    }

    function withdrawToken(
        address token,
        address recipient,
        uint256 value
    ) external onlyOwner noReentrant {
        pay(token, address(this), recipient, value);
    }
}
