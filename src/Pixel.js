import ColorUtils from './utils/ColorUtils'
import ContractToCanvas from './utils/ContractToCanvas'

class Pixel {
  constructor(x, y, z, color, signature, owner, price) {
    this.x = x
    this.y = y
    this.z = z
    this.color = color
    this.signature = signature
    this.owner = owner
    this.price = price
    this.build_image_data()
  }

  static from_contract(contract_args) {
    let coords = new ContractToCanvas(contract_args.i.toNumber()).get_coords()
    return new this(
      coords.x,
      coords.y,
      0,
      ColorUtils.bytes3ToHex(contract_args.new_color),
      contract_args.new_signature, //TODO: unpack de signature
      contract_args.new_owner,
      contract_args.price
    )
  }
  
  build_image_data() {
    var pixel_array = new Uint8ClampedArray(ColorUtils.hexToIntArray(this.color))
    this.image_data = new ImageData(pixel_array, 1, 1)
  }

  rgba_color() {
    return ColorUtils.hexToRgb(this.color)
  }
}

export default Pixel