class WorldToContract {
  constructor(x,y) {
    this.x = x
    this.y = y
    this.find_ring_and_first_index()
  }

  find_ring_and_first_index() {
    this.ring = Math.max(Math.abs(this.x), Math.abs(this.y))
    this.first_index = Math.pow(this.ring * 2 - 1, 2)
  }

  get_index() {
    let result
    if (this.y === this.ring)
      result = this.f_y_max()
    else if (this.y === -this.ring)
      result = this.f_y_min()
    else if (this.x > 0)
      result = this.f_x_max()
    else if (this.x < 0)
      result = this.f_x_min()
    else
      result = 0
    return result
  }

  f_x_max() { return this.first_index + this.ring - 1 - this.y }

  f_x_min() { return this.first_index + 5 * this.ring - 1 + this.y }

  f_y_max() { return this.first_index + 7 * this.ring - 1 + this.x }

  f_y_min() { return this.first_index + 3 * this.ring - 1 - this.x }

}

export default WorldToContract
