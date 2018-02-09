class ContractToWorld {
  static init(g_block, h_array) {
    this.genesis_block = g_block
    this.halving_array = h_array
  }

  static index_to_coords(i) {
    if (i === 0)
      return { x: 0, y: 0 }
    let { first_index, ring } = this.find_ring_and_first_index(i)
    let result
    if (i < first_index + 2 * ring)
      result = this.f_x_max(i, first_index, ring)
    else if (i < first_index + 4 * ring)
      result = this.f_y_min(i, first_index, ring)
    else if (i < first_index + 6 * ring)
      result = this.f_x_min(i, first_index, ring)
    else
      result = this.f_y_max(i, first_index, ring)
    return result
  }

  /* return (block.number - g_block) + (block.number <= halving_1 ? block.number - g_block : halving_1 - g_block) + (block.number <= halving_2 ? block.number - g_block : halving_2 - g_block) + (block.number <= halving_3 ? block.number - g_block : halving_3 - g_block); */
  static max_index(current_block) {
    return this.halving_array.reduce((total, threshold) => {
      return total += current_block <= threshold ? current_block - this.genesis_block : threshold - this.genesis_block
    }, current_block - this.genesis_block)
  }

  static canvas_dimension(max_index) {
    return this.find_ring_and_first_index(max_index).ring * 2 + 1
  }

  static find_ring_and_first_index(i) {
    let ring = Math.floor(0.5 * Math.ceil(Math.sqrt(i + 1)))
    return {
      ring: ring,
      first_index: Math.pow(ring * 2 - 1, 2)
    }
  }

  static f_x_max(i, fi, r) { return { x: r, y: fi + r - i - 1 } }

  static f_x_min(i, fi, r) { return { x: -r, y: i + 1 - (fi + 5 * r) } }

  static f_y_max(i, fi, r) { return { x: i + 1 - (fi + 7 * r), y: r } }

  static f_y_min(i, fi, r) { return { x: fi + 3 * r - i - 1, y: -r } }
}

export default ContractToWorld
