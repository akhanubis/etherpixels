pragma solidity ^0.4.18;

contract usingCanvasBoundaries {
  uint constant x_size = 2049;
  uint constant y_size = 2049;
  uint constant z_size = 24;
  uint public constant half_max_canvas_size = 2048;
  uint public last_threshold; //TODO private
  uint public last_threshold_size; //TODO private
  uint public last_canvas_size_index; //TODO private
  uint private genesis_block;  //TODO private	
	uint public min_bound;
	uint public max_bound;
    
  uint24[29] public thresholds; //TODO private
	uint16[29] public blocks_per_retarget; //TODO private
	
	event CurrentBoundaries(uint current_min, uint current_max);
  
  function usingCanvasBoundaries() internal {
    last_canvas_size_index = 0;
    genesis_block = block.number;
    thresholds = [262784,492734,692834,867968,1021954,1157062,1274592,1377786,1467986,1546834,1615834,1676034,1729074,1774770,1814730,1849668,1879908,1906368,1929006,1950606,1967406,1983746,1998994,2012338,2022714,2034818,2041880,2059730,2084024];
    blocks_per_retarget = [256,300,348,404,476,556,644,756,880,1024,1200,1400,1632,1904,2220,2588,3024,3528,4116,4800,5600,6536,7624,8896,10376,12104,14124,17850,24294];
  }
    
	function computeBoundary() internal returns(uint) {
		uint blocks_passed = block.number - genesis_block;
    for(uint i = last_canvas_size_index; i < thresholds.length; i++) {
      if (thresholds[i] >= blocks_passed) {
        last_canvas_size_index = i;
        return last_threshold_size + (blocks_passed - last_threshold) / blocks_per_retarget[i];
      }
      last_threshold_size += (thresholds[i] - last_threshold) / blocks_per_retarget[i];
      last_threshold = thresholds[i];
    }
    last_canvas_size_index = thresholds.length;
    return half_max_canvas_size;
	}
	
  function updateBoundaries() internal returns(uint) {
    uint b = computeBoundary();
    min_bound = half_max_canvas_size - b;
    max_bound = half_max_canvas_size + b;
  }
	
	function checkCoordinates(uint _z, uint _c1, uint _c2) internal {
    require(_z < z_size);
		updateBoundaries();
	  CurrentBoundaries(min_bound, max_bound);
		require(_c1 >= min_bound && _c1 <= max_bound && _c2 >= min_bound && _c2 <= max_bound);
	}
	
	function ThresholdsData() public view returns(uint24[29] thrs, uint16[29] bprs, uint) {
		return (thresholds, blocks_per_retarget, genesis_block);
	}
  
  function CanvasSize() public pure returns(uint x, uint y, uint z) {
    return (x_size, y_size, z_size);
  }
}