var ColorUtils = (() => {
  var emptyColor = '#000000'
  
  var _intToPaddedHex = (int) => {
    return ('00' + int.toString(16)).slice(-2)
  }
  
  var rgbToHex = (rgb) => {
    return `#${ _intToPaddedHex(rgb.r) }${ _intToPaddedHex(rgb.g) }${ _intToPaddedHex(rgb.b) }`
  }
  
  var _randomChannel = () => {
    return Math.floor(Math.random() * 256)
  }
  
  var bytes3ToHex = (bytes3) => {
    return `#${ bytes3.substr(2, 6) }`
  }
  
  var rgbToBytes3 = (rgb) => {
    return '0x' + rgbToHex(rgb).substr(1, 6)
  }
  
  var hexToIntArray = (hex) => {
    return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16), 255]
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
    hexToIntArray: hexToIntArray,
    emptyColor: emptyColor,
    randomColor: randomColor
  }
})()

export default ColorUtils
