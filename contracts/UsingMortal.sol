pragma solidity ^0.4.18;

contract usingMortal {
    address contract_owner;
    function usingMortal() internal { contract_owner = msg.sender; }
    function Kill() public { 
        require(msg.sender == contract_owner);
        selfdestruct(contract_owner);
    }
}