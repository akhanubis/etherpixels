var ColorUtils = (() => {
  var emptyColor = '#000000'
  
  var _intToPaddedHex = (int) => {
    return ('00' + int.toString(16)).slice(-2)
  }
  
  var rgbToHex = (rgb) => {
    return `#${ _intToPaddedHex(rgb.r) }${ _intToPaddedHex(rgb.g) }${ _intToPaddedHex(rgb.b) }`
  }

  var hexToIntArray = (hex) => {
    return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16), 255]
  }
  
  var intArrayToRgb = (int_array) => {
    return {
      r: int_array[0],
      g: int_array[1],
      b: int_array[2],
      a: int_array[3] / 255
    }
  }

  var intArrayToHex = (int_array) => {
    return `#${ _intToPaddedHex(int_array[0]) }${ _intToPaddedHex(int_array[1]) }${ _intToPaddedHex(int_array[2]) }`
  }

  var hexToRgb = (hex) => {
    return intArrayToRgb(hexToIntArray(hex))
  }

  var hexToBytes3 = (hex) => {
    return `0x${ hex.substr(1, 6) }`
  }
  
  var _randomChannel = () => {
    return Math.floor(Math.random() * 256)
  }
  
  var bytes3ToHex = (bytes3) => {
    return `#${ bytes3.substr(2, 6) }`
  }
  
  var rgbToBytes3 = (rgb) => {
    return hexToBytes3(rgbToHex(rgb))
  }
  
  var bytes3ToIntArray = (bytes3) => {
    return hexToIntArray(bytes3ToHex(bytes3))
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
    rgbToBytes3: rgbToBytes3,
    rgbToHex: rgbToHex,
    bytes3ToHex: bytes3ToHex,
    bytes3ToIntArray: bytes3ToIntArray,
    hexToRgb: hexToRgb,
    hexToIntArray: hexToIntArray,
    hexToBytes3: hexToBytes3,
    intArrayToRgb: intArrayToRgb,
    intArrayToHex: intArrayToHex,
    emptyColor: emptyColor,
    randomColor: randomColor
  }
})()

export default ColorUtils
