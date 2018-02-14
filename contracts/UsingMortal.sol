pragma solidity ^0.4.18;

contract usingMortal {
    address internal contract_owner;
    function usingMortal() internal { contract_owner = msg.sender; }

    function Withdraw(uint _amount) public {
      assert(msg.sender == contract_owner);
      if (_amount > this.balance)
        _amount = this.balance;
      contract_owner.transfer(_amount);
    }
}