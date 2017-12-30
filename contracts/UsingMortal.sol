pragma solidity ^0.4.18;

contract usingMortal {
    address owner;
    function usingMortal() internal { owner = msg.sender; }
    function Kill() public { 
        require(msg.sender == owner);
        selfdestruct(owner);
    }
}