pragma solidity ^0.5.0;

contract Duplicate {
    uint x;
    uint y;

    function b() public {
      x = 5;
      y = 5;
    }
}
