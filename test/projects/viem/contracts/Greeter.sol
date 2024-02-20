/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

contract Greeter {
    string public greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }

    function asOther() public {}

    function throwAnError(string memory message) public {
        greeting = "goodbye";
        require(false, message);
    }
}
