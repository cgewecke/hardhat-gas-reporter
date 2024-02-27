/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

contract Immutable {
  uint public val;
  address public immutable owner;
  uint public immutable scalar;

  constructor(uint base) {
    uint _scalar = base + 5;
    scalar = _scalar;
    owner = msg.sender;
  }

  function setVal(uint x) public {
    val = x* scalar;
  }
}
