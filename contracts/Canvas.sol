pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
  uint private min_cd = 20;
  uint private max_cd = 2880;
  uint private wei_per_block_cd = 125000000000; /* 125 gwei */

  uint32[50000000] private availability;
  
  event PixelPainted(uint i, address new_owner, uint32 locked_until, bytes3 new_color);
  event PixelUnavailable(uint i, address new_owner, uint32 locked_until, bytes3 new_color);
  
	function Paint(uint _index, bytes3 _color) public payable {
    uint paid_cd = msg.value / wei_per_block_cd;
    require(paid_cd >= min_cd && _index <= max_index());
    paint_pixel(_index, _color, paid_cd);
	}
  
  function BatchPaint(uint8 _batch_size, uint[] _index, bytes3[] _color) public payable {
    uint paid_cd = msg.value / (_batch_size * wei_per_block_cd);
    require(paid_cd >= min_cd);
    uint m_i = max_index();
    for(uint8 i = 0; i < _batch_size; i++) {
      require(_index[i] <= m_i);
      paint_pixel(_index[i], _color[i], paid_cd);
    }
  }

  function FeeInfo() public view returns(uint wei_per_cooldown, uint min_cooldown, uint max_cooldown) {
    return (wei_per_block_cd, min_cd, max_cd);
  }
  
  function paint_pixel(uint _index, bytes3 _color, uint _cd) private {
    if (block.number < availability[_index])
      PixelUnavailable(_index, msg.sender, availability[_index], _color);
    else {
      availability[_index] = uint32(block.number + ((max_cd < _cd) ? max_cd : _cd)); /* will break after block 4294967295 */
      PixelPainted(_index, msg.sender, availability[_index], _color);
    }
	}
}