import ColorUtils from './utils/ColorUtils'

class PixelData {
  constructor(contract_args) {
    this.x = contract_args.x.toNumber()
    this.y = contract_args.y.toNumber()
    this.z = contract_args.z.toNumber()
    this.color = contract_args.new_color
    this.signature = contract_args.new_signature //TODO: unpack de signature
    this.owner = contract_args.new_owner
    this.price = contract_args.price
    this.build_image_data()
  }
  
  build_image_data() {
    console.log(this.color)
    var pixel_array = new Uint8ClampedArray(ColorUtils.bytes3ToIntArray(this.color))
    console.log(pixel_array)
    this.image_data = new ImageData(pixel_array, 1, 1)
  }
}

export default PixelData