var ColorUtils = (() => {
  var emptyColor = ['#000000']
  
  var _intToPaddedHex = (int) => {
    return ('00' + int.toString(16)).slice(-2)
  }
  
  var _rgbToHex = (rgb) => {
    return `${ _intToPaddedHex(rgb.r) }${ _intToPaddedHex(rgb.g) }${ _intToPaddedHex(rgb.b) }`
  }
  
  //unused
  var _hexToRgb = (hex) => {
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
      a: 255
    }
  }
  
  var _randomChannel = () => {
    return Math.floor(Math.random() * 256)
  }
  
  var rgbArrayToBytes32 = (rgbs) => {
    var header = `0x${ _intToPaddedHex(rgbs.length) }`
    return rgbs.reduce((output, rgb) => {
      return output + _rgbToHex(rgb)
    }, header)
  }
  
  var bytes32ToHexArray = (bytes32) => {
    var hex_frames_count = parseInt(bytes32.substr(2, 2), 16)
    var colors = []
    for(var i = 0; i < hex_frames_count; i++)
      colors.push(`#${ bytes32.substr(4 + i * 6, 6) }`)
    return colors
  }
  
  var randomColor = () => {
    return {
      r: _randomChannel(),
      g: _randomChannel(),
      b: _randomChannel(),
      a: 255
    }
  }
  
  return {
    rgbArrayToBytes32: rgbArrayToBytes32,
    bytes32ToHexArray: bytes32ToHexArray,
    emptyColor: emptyColor,
    randomColor: randomColor
  }
})()

export default ColorUtils
