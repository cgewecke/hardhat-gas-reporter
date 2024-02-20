/* SPDX-License-Identifier: MIT */
pragma solidity >=0.8.0 <0.9.0;

contract Wallet {

    event Deposit(address indexed _sender, uint _value);

    function transferPayment(uint payment, address payable recipient) public {
        payable(recipient).transfer(payment);
    }

    function sendPayment(uint payment, address payable recipient) public {
        if (!payable(recipient).send(payment))
            revert();
    }

    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    receive() external payable
    {
        if (msg.value > 0)
            emit Deposit(msg.sender, msg.value);
    }
}
