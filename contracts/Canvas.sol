pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
  uint public paint_fee = 4 szabo; /* 4000 Gwei */
  uint public cooldown = 10;

  uint32[50000000] public availability;
  
  event PixelPainted(uint i, address new_owner, uint32 locked_until, bytes3 new_color);
  
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
    require(block.number >= availability[_index]);
    availability[_index] = uint32(block.number + cooldown); /* will break after block 4294967295 */
    PixelPainted(_index, msg.sender, availability[_index], _color);
	}
}