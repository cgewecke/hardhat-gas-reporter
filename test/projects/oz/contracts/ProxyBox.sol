/* SPDX-License-Identifier: MIT */
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ProxyBox is Initializable {
    string public contents;

    function initialize() external initializer { }

    function box() public view returns (string memory) {
        return contents;
    }

    function setBox(string memory _contents) public {
        contents = _contents;
    }
}
