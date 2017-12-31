pragma solidity ^0.4.18;

contract usingCanvasBoundaries {
    uint constant max_canvas_half_size = 4096;
    uint public last_threshold; //TODO private
    uint public last_threshold_size; //TODO private
    uint public last_canvas_size_index; //TODO private
    uint public genesis_block;  //TODO private	
	int public min_bound;
	int public max_bound;
	
    struct Boundary {
        uint threshold;
        uint blocks_per_retarget;
    }
    
    Boundary[29] public boundaries_thresholds; //TODO private
	
	event CurrentBoundaries(int current_min, int current_max);
    
    function usingCanvasBoundaries() internal {
        last_canvas_size_index = 0;
        genesis_block = block.number;
        uint24[29] memory thresholds = [262784,492734,692834,867968,1021954,1157062,1274592,1377786,1467986,1546834,1615834,1676034,1729074,1774770,1814730,1849668,1879908,1906368,1929006,1950606,1967406,1983746,1998994,2012338,2022714,2034818,2041880,2059730,2084024];
        uint16[29] memory blocks_per_retarget = [256,300,348,404,476,556,644,756,880,1024,1200,1400,1632,1904,2220,2588,3024,3528,4116,4800,5600,6536,7624,8896,10376,12104,14124,17850,24294];
        for (uint i = 0; i < thresholds.length; i++) {
			boundaries_thresholds[i].threshold = thresholds[i];
			boundaries_thresholds[i].blocks_per_retarget = blocks_per_retarget[i];
		}
    }
    
	function computeBoundary() internal returns(uint) {
		uint blocks_passed = block.number - genesis_block;
        for(uint i = last_canvas_size_index; i < boundaries_thresholds.length; i++) {
            Boundary storage b = boundaries_thresholds[i];
            if (b.threshold >= blocks_passed) {
                last_canvas_size_index = i;
                return last_threshold_size + (blocks_passed - last_threshold) / b.blocks_per_retarget;
            }
            last_threshold = b.threshold;
            last_threshold_size += (b.threshold - last_threshold) / b.blocks_per_retarget;
        }
        last_canvas_size_index = boundaries_thresholds.length;
        return max_canvas_half_size;
	}
	
    function updateBoundaries() internal returns(uint) {
		uint b = computeBoundary();
		min_bound = int(-b);
		max_bound = int(b);
    }
	
	function checkCoordinates(int _c1, int _c2) internal {
		updateBoundaries();
	    CurrentBoundaries(min_bound, max_bound);
		require(_c1 >= min_bound && _c1 <= max_bound && _c2 >= min_bound && _c2 <= max_bound);
	}
	
	function ThresholdsLength() public view returns(uint count) {
		return boundaries_thresholds.length;
	}
}