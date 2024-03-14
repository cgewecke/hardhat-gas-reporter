/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

contract Undeployed {
    event Amount(uint val);

    function f() public {
      emit Amount(5);
    }
}
