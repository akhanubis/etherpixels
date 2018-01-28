pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
  struct Pixel {
    uint32 locked_until;
    address owner;
    bytes3 color;
    /* 5 bytes unused*/
  }

  uint public paint_fee = 100;
  uint public cooldown = 10;

  mapping(uint => Pixel) public pixels;
  
  event PixelPainted(uint i, address old_owner, address new_owner, uint32 locked_until, bytes3 new_color);
  
	function Paint(uint _index, bytes3 _color) public payable {
    require(msg.value >= paint_fee);
    paint_pixel(_index, _color);
	}
  
  function BatchPaint(uint8 _batch_size, uint[] _index, bytes3[] _color) public payable {
    require(msg.value >= paint_fee * _batch_size);
    for(uint8 i = 0; i < _batch_size; i++)
      paint_pixel(_index[i], _color[i]);
  }
  
  function paint_pixel(uint _index, bytes3 _color) private {
    check_coordinates(_index);
    Pixel storage pixel = pixels[_index];
    require(block.number >= pixel.locked_until);
    pixel.locked_until = uint32(block.number + cooldown); /* will break after block 4294967295 */
    pixel.color = _color;
    PixelPainted(_index, pixel.owner, msg.sender, pixel.locked_until, _color);
    pixel.owner = msg.sender;
	}
}