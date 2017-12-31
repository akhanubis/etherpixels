let ColorUtils = {
  rgbToHex: (rgb) => {
    return `0x${ rgb.r.toString(16) }${ rgb.g.toString(16) }${ rgb.b.toString(16) }`
  }
}

export default ColorUtils
