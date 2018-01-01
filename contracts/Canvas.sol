pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
	int constant public chunk_size = 20;
	int constant public chunk_size_squared = 400;
	
	struct Pixel {
        bytes32 color; // 0..1: number of frames, 2..32: 3 bytes per frame
        bytes32 signature;
        uint floor_price;
        address owner;
    }
	
    mapping(int => mapping(int => Pixel)) public pixels;
    
    event PixelSold(address old_owner, address new_owner, uint price);
    event PixelPainted(int x, int y, bytes32 new_color, bytes32 new_signature, address new_owner);
    
	function Paint(int _x, int _y, bytes32 _color, bytes32 _signature) public payable {
    //checkCoordinates(_x, _y);
    Pixel storage pixel = pixels[_x][_y];
    //require(msg.value > pixel.floor_price);
    pixel.color = _color;
    pixel.signature = _signature;
    pixel.floor_price = msg.value;
    PixelPainted(_x, _y, _color, _signature, msg.sender);
    address old_owner = pixel.owner == address(0) ? owner : pixel.owner; //nuevos pixeles son propiedad mia
    pixel.owner = msg.sender;
    old_owner.transfer(msg.value);
    PixelSold(old_owner, pixel.owner, msg.value);
	}
}