pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
  uint public min_cooldown = 10;
  uint public max_cooldown = 2880;
  uint public wei_per_block_cooldown = 500000000000; /* 500 gwei */

  uint32[50000000] public availability;
  
  event PixelPainted(uint i, address new_owner, uint32 locked_until, bytes3 new_color);
  
	function Paint(uint _index, bytes3 _color) public payable {
    require(_index <= max_index());
    paint_pixel(_index, _color, msg.value);
	}
  
  function BatchPaint(uint8 _batch_size, uint[] _index, bytes3[] _color) public payable {
    uint paid_cd = msg.value / _batch_size;
    uint m_i = max_index();
    for(uint8 i = 0; i < _batch_size; i++) {
      require(_index[i] <= m_i);
      paint_pixel(_index[i], _color[i], paid_cd);
    }
  }
  
  function paint_pixel(uint _index, bytes3 _color, uint _value) private {
    require(block.number >= availability[_index]);
    uint paid_cooldown = _value / wei_per_block_cooldown;
    availability[_index] = uint32(block.number + min_cooldown + ((max_cooldown < paid_cooldown) ? max_cooldown : paid_cooldown)); /* will break after block 4294967295 */
    PixelPainted(_index, msg.sender, availability[_index], _color);
	}
}