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
	
  Pixel[2049][2049][24] public pixels;
  
  event PixelSold(uint x, uint y, uint z, bytes3 new_color, bytes32 new_signature, address old_owner, address new_owner, uint price);
  
	function Paint(uint _x, uint _y, uint _z, bytes3 _color, bytes32 _signature) public payable {
    paint_pixel(_x, _y, _z, _color, _signature, msg.value);
	}
  
  function BatchPaint(uint8 _batch_size, uint[] _x, uint[] _y, uint[] _z, bytes3[] _color, uint[] _price, bytes32 _signature) public payable {
    int remaining = int(msg.value);
    for(uint8 i = 0; i < _batch_size; i++) {
      paint_pixel(_x[i], _y[i], _z[i], _color[i], _signature, _price[i]);
      remaining -= int(_price[i]);
      require(remaining > 0);
    }
  }
  
  function paint_pixel(uint _x, uint _y, uint _z, bytes3 _color, bytes32 _signature, uint _price) private {
    //checkCoordinates(_z, _x, _y);
    Pixel storage pixel = pixels[_z][_y][_x];
    //require(_price > pixel.floor_price);
    pixel.color = _color;
    pixel.signature = _signature;
    pixel.floor_price = _price;
    address old_owner = pixel.owner == address(0) ? owner : pixel.owner; //nuevos pixeles son propiedad mia
    pixel.owner = msg.sender;
    old_owner.transfer(_price);
    PixelSold(_x, _y, _z, _color, _signature, old_owner, msg.sender, _price);
	}
}