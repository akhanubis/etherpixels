var ColorUtils = (() => {
  var emptyColor = '#000000'
  
  var _intToPaddedHex = (int) => {
    return ('00' + int.toString(16)).slice(-2)
  }
  
  var _rgbToHex = (rgb) => {
    return `${ _intToPaddedHex(rgb.r) }${ _intToPaddedHex(rgb.g) }${ _intToPaddedHex(rgb.b) }`
  }
  
  var _randomChannel = () => {
    return Math.floor(Math.random() * 256)
  }
  
  var bytes3ToHex = (bytes3) => {
    return `#${ bytes3.substr(2, 6) }`
  }
  
  var rgbToBytes3 = (rgb) => {
    return '0x' + _rgbToHex(rgb)
  }
  
  var bytes3ToIntArray = (bytes3) => {
    return [parseInt(bytes3.substr(2, 2), 16), parseInt(bytes3.substr(4, 2), 16), parseInt(bytes3.substr(6, 2), 16), 255]
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
    bytes3ToHex: bytes3ToHex,
    bytes3ToIntArray: bytes3ToIntArray,
    emptyColor: emptyColor,
    randomColor: randomColor
  }
})()

export default ColorUtils
