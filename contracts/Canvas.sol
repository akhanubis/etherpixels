pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
    struct Pixel {
        bytes3[] color;
        bytes32 signature;
        uint floor_price;
        address owner;
    }
    
    mapping(int => mapping(int => Pixel)) public pixels;
    
    event PixelSold(address, address, uint);
    event PixelPainted(int, int, bytes3[], bytes32, address);
    event CurrentBoundary(int);
    
	function Paint(int _x, int _y, bytes3[] _color, bytes32 _signature) public payable {
	    int b = int(boundary());
	    CurrentBoundary(b);
	    //require(_x >= -b && _x <= b && _y >= -b && _y <= b);
	    Pixel storage pixel = pixels[_x][_y];
	    require(msg.value > pixel.floor_price);
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