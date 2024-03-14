/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

import "./UrGreeter.sol";

contract EmphaticGreeter is UrGreeter {
    string public greeting;

    constructor() {
        greeting = "!!!";
    }

    function greet() public view returns (string memory) {
        return greeting;
    }
}
