class ContractToWorld {
  constructor(index) {
    this.i = index
    this.find_ring_and_first_index()
  }

  find_ring_and_first_index() {
    this.ring = Math.floor(0.5 * Math.ceil(Math.sqrt(this.i + 1)))
    this.first_index = Math.pow(this.ring * 2 - 1, 2)
  }

  get_coords() {
    if (this.i === 0)
      return { x: 0, y: 0 }
    let result
    if (this.i < this.first_index + 2 * this.ring)
      result = this.f_x_max()
    else if (this.i < this.first_index + 4 * this.ring)
      result = this.f_y_min()
    else if (this.i < this.first_index + 6 * this.ring)
      result = this.f_x_min()
    else
      result = this.f_y_max()
    return result
  }

  get_canvas_size() {
    if (this.ring === 0)
      return {
        width: 1,
        height: 1
      }
    let side_length = this.ring * 2 + 1
    return {
      width: side_length,
      height: side_length
    }
  }

  f_x_max() { return { x: this.ring, y: this.first_index + this.ring - this.i - 1 } }

  f_x_min() { return { x: -this.ring, y: this.i + 1 - (this.first_index + 5 * this.ring) } }

  f_y_max() { return { x: this.i + 1 - (this.first_index + 7 * this.ring), y: this.ring } }

  f_y_min() { return { x: this.first_index + 3 * this.ring - this.i - 1, y: -this.ring } }

}

export default ContractToWorld
