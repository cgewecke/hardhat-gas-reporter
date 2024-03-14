/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

import "./VersionA.sol";
import "./VersionB.sol";

contract Factory {

  VersionA public versionA;
  VersionB public versionB;

  function deployVersionA() public {
    versionA = new VersionA();
  }

  function deployVersionB() public {
    versionB = new VersionB();
  }
}