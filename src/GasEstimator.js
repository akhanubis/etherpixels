import { Component } from 'react'

class GasEstimator extends Component {
  constructor(props) {
    super(props)
    this.gas_per_new_pixel = 60000
    this.gas_per_pixel = 45000
    this.gas_per_extra_new_pixel = 40000
    this.gas_per_extra_pixel = 25000
  }

  estimate_gas(pixels) {
    let gas = pixels[0].is_new() ? this.gas_per_new_pixel : this.gas_per_pixel
    for(var j = 1; j < pixels.length; j++)
      gas += pixels[j].is_new() ? this.gas_per_extra_new_pixel : this.gas_per_extra_pixel
    return gas
  }

  estimate_fee(pixels) {
    return pixels.length * this.props.fee
  }

  estimate_total(pixels) {
    return this.props.gas_price.mul(this.estimate_gas(pixels)).add(this.estimate_fee(pixels))
  }

  render() {
    return null
  }
}

export default GasEstimator