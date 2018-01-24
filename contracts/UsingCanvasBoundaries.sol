pragma solidity ^0.4.18;

contract usingCanvasBoundaries {
  uint private g_block;
	 
  function usingCanvasBoundaries() internal {
    g_block = block.number;
  }

	function check_coordinates(uint _index) internal view {
    require(_index < max_index() + 1);
	}
	
	function max_index() private view returns(uint m_index) {
    return block.number - g_block;
  }

  function GenesisBlock() public view returns(uint genesis_block) {
    return g_block;
  }
}