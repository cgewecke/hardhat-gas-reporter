/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

import "./Wallets/Wallet.sol";
import "./MultiContractFile.sol";

contract VariableCosts is Wallet {
  uint q;
  mapping(uint => address) map;
  MultiContractFileA multi;

  constructor() {
    multi = new MultiContractFileA();
  }

  function callEmptyFn() public pure {}

  function callPureFnReturn(uint x) public pure returns (uint){
    return x;
  }

  function callRevertingPureFn() public pure {
    require(false, "no");
  }

  function callViewFn(uint x) public view returns (address){
    return map[x];
  }

  function addToMap(uint[] memory adds) public {
    for(uint i = 0; i < adds.length; i++)
      map[adds[i]] = address(this);
  }

  function removeFromMap(uint[] memory dels) public {
    for(uint i = 0; i < dels.length; i++)
      delete map[dels[i]];
  }

  function unusedMethod(address a) public {
    map[1000] = a;
  }

  function methodThatThrows(bool err) public {
    require(!err);
    q = 5;
  }

  function otherContractMethod() public {
    multi.hello(); // 20,000 gas (sets uint to 5 from zero)
    multi.hello(); //  5,000 gas (sets existing storage)
    multi.hello(); //  5,000 gas (sets existing storage)
  }
}
