import ColorUtils from './utils/ColorUtils'
import ContractToWorld from './utils/ContractToWorld'
import WorldToContract from './utils/WorldToContract'

class Pixel {
  constructor(x, y, color, owner, price, old_color, index) {
    this.x = x
    this.y = y
    this.color = color
    this.owner = owner
    this.price = price
    this.old_color = old_color
    this.index = index
    this.build_image_data()
  }

  static from_contract(tx_hash, contract_args) {
    let coords = new ContractToWorld(contract_args.i.toNumber()).get_coords()
    let p = new this(
      coords.x,
      coords.y,
      ColorUtils.bytes3ToHex(contract_args.new_color),
      contract_args.new_owner,
      contract_args.price,
      null,
      contract_args.i.toNumber()
    )
    p.tx = tx_hash
    return p
  }
  
  change_color(new_color) {
    this.old_color = this.color
    this.color = new_color
    this.build_image_data()
    return this
  }

  build_image_data() {
    var pixel_array = new Uint8ClampedArray(ColorUtils.hexToIntArray(this.color))
    this.image_data = new ImageData(pixel_array, 1, 1)
  }

  rgba_color() {
    return ColorUtils.hexToRgb(this.color)
  }

  contract_index() {
    return new WorldToContract(this.x, this.y).get_index()
  }

  bytes3_color() {
    return ColorUtils.hexToBytes3(this.color)
  }

  is_inside_canvas(max_index) {
    return this.index <= max_index
  }
}

export default Pixel