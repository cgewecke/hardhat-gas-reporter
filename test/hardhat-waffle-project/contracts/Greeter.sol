pragma solidity ^0.5.1;

contract Greeter {

    string public greeting;

    constructor(string memory _greeting) public {
        greeting = _greeting;
    }

    function greet() public view returns (string memory) {
        return greeting;
    }

    function setGreeting(string memory _greeting) public {
         greeting = _greeting;
    }

    function throwAnError(string memory message) public {
        greeting = "goodbye";
        require(false, message);
    }
}
