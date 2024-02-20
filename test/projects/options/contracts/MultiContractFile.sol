/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

contract MultiContractFileA {
  uint x;

  function hello() public {
    x = 5;
  }
}

contract MultiContractFileB {
  uint x;

  function goodbye() public {
    x = 5;
  }
}