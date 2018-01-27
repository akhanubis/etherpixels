pragma solidity ^0.4.18;
import "./UsingMortal.sol";
import "./UsingCanvasBoundaries.sol";

contract Canvas is usingMortal, usingCanvasBoundaries {
  /* packed to 32 bytes */
	struct Pixel {
    bytes3 color;
    uint72 floor_price; /* max value 4722.366482869645213695 eth */
    address owner;
  }
	/* packed to 32 bytes */
  uint216 private total_value;
  uint40 private total_pixels;

  mapping(uint => Pixel) public pixels;
  
  event PixelSold(uint i, address old_owner, address new_owner, uint price, bytes3 new_color);
  
  function Canvas() public {
    pixels[0] = Pixel(0xf0f0f0, 100, msg.sender);
    total_value = 100;
    total_pixels = 1;
    PixelSold(0, msg.sender, msg.sender, 100, 0xA0A0A0);
  }

	function Paint(uint _index, bytes3 _color) public payable {
    paint_pixel(_index, _color, msg.value);
	}
  
  function BatchPaint(uint8 _batch_size, uint[] _index, bytes3[] _color, uint[] _price) public payable {
    int remaining = int(msg.value);
    for(uint8 i = 0; i < _batch_size; i++) {
      paint_pixel(_index[i], _color[i], _price[i]);
      remaining -= int(_price[i]);
      require(remaining >= 0);
    }
  }
  
  function paint_pixel(uint _index, bytes3 _color, uint _price) private {
    require(_price == uint72(_price)); /* who would pay more than 4k eth? */
    check_coordinates(_index);
    Pixel storage pixel = pixels[_index];
    address old_owner;
    if (pixel.owner == address(0)) {
      require(_price > total_value / total_pixels); /* new pixels price is the mean of all the pixels already sold */
      total_pixels++;
      old_owner = contract_owner; /* new pixels belong to me */
    }
    else {
      total_value -= pixel.floor_price;
      old_owner = pixel.owner;
      if (old_owner == msg.sender)
        /* this allows the current owner to buy to himself to change the current color or lower the pixel price (by incurring in some loses because of gas) */
        require(_price <= pixel.floor_price);
      else
        /* it is possible for the current owner to buy to himself using a different account repeatedly until the pixel price is so hight it is unbuyable but that would mean wasting a lot of gas */ 
        require(_price > pixel.floor_price && _price < pixel.floor_price * 1.1);
    }
    pixel.floor_price = uint72(_price);
    total_value += pixel.floor_price;
    pixel.color = _color;
    pixel.owner = msg.sender;
    old_owner.transfer(_price);
    PixelSold(_index, old_owner, msg.sender, _price, _color);
	}

  function MarketCap() public view returns(uint market_cap, uint pixels_quantity) {
    return (total_value, total_pixels);
  }
}