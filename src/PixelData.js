import ColorUtils from './utils/ColorUtils'

class PixelData {
  constructor(x, y, color_bytes, signature_bytes, owner, timer_reference) {
    this.x = x
    this.y = y
    this.colors = color_bytes ? ColorUtils.bytes32ToHexArray(color_bytes) : ColorUtils.emptyColor
    this.signature = 'anu estuvo aqui' //TODO: unpack de signature
    this.owner = owner
    if (this.timer_required())
      this.timer_reference = timer_reference
  }
  
  timer_required() {
    return this.colors.length > 1
  }
}

export default PixelData