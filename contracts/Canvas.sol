pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
  uint private starting_price = 5000000000000; /* 5000 gwei */

  /* packed to 32 bytes */
  struct Pixel {
    uint96 price;
    address owner;
  }
  
  mapping(uint => Pixel) private pixels;

  event PixelPainted(uint i, address new_owner, address old_owner, uint price, bytes3 new_color);
  event PixelUnavailable(uint i, address new_owner, uint price, bytes3 new_color);
  
	function Paint(uint _index, bytes3 _color) public payable {
    require(_index <= max_index());
    paint_pixel(_index, _color, msg.value);
	}

  function BatchPaint(uint8 _batch_size, uint[] _index, bytes3[] _color, uint[] _paid) public payable {
    uint remaining = msg.value;
    uint m_i = max_index();
    for(uint8 i = 0; i < _batch_size; i++) {
      require(remaining >= _paid[i] && _index[i] <= m_i);
      paint_pixel(_index[i], _color[i], _paid[i]);
      remaining -= _paid[i];
    }
  }

  function StartingPrice() public view returns(uint price) {
    return starting_price;
  }

  function LowerStartingPrice(uint _new_starting_price) public {
    assert(msg.sender == contract_owner && _new_starting_price < starting_price);
    starting_price = _new_starting_price;
  }
  
  function paint_pixel(uint _index, bytes3 _color, uint _paid) private {
    Pixel storage p = pixels[_index];
    if (msg.sender == p.owner) {
      PixelPainted(_index, msg.sender, msg.sender, p.price, _color);
    }
    else {
      uint current_price = p.price == 0 ? starting_price : uint(p.price);
      if (_paid < current_price * 11 / 10)
        PixelUnavailable(_index, msg.sender, current_price, _color);
      else {
        if (_paid > current_price * 2)
          _paid = current_price * 2;
        p.price = uint96(_paid);
        require(p.price == _paid); /* casting guard */ 
        address old_owner = p.owner;
        p.owner = msg.sender;
        PixelPainted(_index, msg.sender, old_owner, p.price, _color);
        if (old_owner != address(0))
          old_owner.transfer(_paid * 98 / 100);
      }
    }
	}
}