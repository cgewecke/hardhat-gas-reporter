// SPDX-License-Identifier: MIT
// Copyright (c) 2021 Yuichiro Aoki
// This test fixture adapted from https://github.com/yuichiroaoki/flash-swap-example
pragma solidity =0.7.6;


contract Base {

    bool internal locked;
	address public owner;

    event Received(address, uint);

    constructor() {
		owner = msg.sender;
    }
    modifier noReentrant() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

}