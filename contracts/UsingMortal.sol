pragma solidity ^0.4.18;

contract usingMortal {
    address contract_owner;
    function usingMortal() internal { contract_owner = msg.sender; }

    function Kill() public { 
        require(msg.sender == contract_owner);
        selfdestruct(contract_owner);
    }

    function Withdraw(uint _amount) public {
      require(msg.sender == contract_owner);
      if (_amount > this.balance)
        _amount = this.balance;
      contract_owner.transfer(_amount);
    }
}