pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
	struct Pixel {
    bytes3 color;
    bytes32 signature;
    uint floor_price;
    address owner;
  }
	
  Pixel[4097][4097][24] public pixels;
  
  event PixelSold(uint x, uint y, uint z, bytes3 new_color, bytes32 new_signature, address old_owner, address new_owner, uint price);
  
	function Paint(uint _x, uint _y, uint _z, bytes3 _color, bytes32 _signature) public payable {
    //checkCoordinates(_z, _x, _y);
    Pixel storage pixel = pixels[_z][_y][_x];
    //require(msg.value > pixel.floor_price);
    pixel.color = _color;
    pixel.signature = _signature;
    pixel.floor_price = msg.value;
    address old_owner = pixel.owner == address(0) ? owner : pixel.owner; //nuevos pixeles son propiedad mia
    pixel.owner = msg.sender;
    old_owner.transfer(msg.value);
    PixelSold(_x, _y, _z, _color, _signature, old_owner, msg.sender, msg.value);
	}
}