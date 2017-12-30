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
    
    event PixelSold(address old_owner, address new_owner, uint price);
    event PixelPainted(int x, int y, bytes3[] new_color, bytes32 new_signature, address new_owner);
    
	function Paint(int _x, int _y, bytes3[] _color, bytes32 _signature) public payable {
		checkTwoCoordinates(_x, _y);
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
	
	function GetPixel(int _x, int _y) public constant returns(uint, address, bytes32, bytes3[]) {
		checkTwoCoordinates(_x, _y);
		var p = pixels[_x][_y];
		return (p.floor_price, p.owner, p.signature, p.color);
	}
	
	function GetPixels(int _min_x, int _max_x, int _min_y, int _max_y) public constant returns(Pixel[]) {
		checkFourCoordinates(_min_x, _max_x, _min_y, _max_y);
		require(_max_x >= _min_x && _max_y >= _min_y);
		var dimensions = (_max_x - _min_x + 1) * (_max_y - _min_y + 1);
		Pixel[] storage pixels_data;
		for (int i = _min_x; i <= _max_x; i++)
			for (int j = _min_y; j <= _max_y; j++)
				pixels_data.push(pixels[i][j]);
		return pixels_data;
	}
}