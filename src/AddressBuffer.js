import zlib from 'zlib'
import BigNumber from 'bignumber.js'

class AddressBuffer {
  static get entry_size() { return 29 }
  static get address_length() { return 20 }
  static get price_length() { return 9 }
  static get resize_chunk_size() { return 240 } /* in entries amount */

  constructor(buffer) {
    this.raw_buffer = new ArrayBuffer(buffer.byteLength + this.address_offset(AddressBuffer.resize_chunk_size))
    this.buffer = new Uint8Array(buffer)
  }

  address_at(i) {
    this.try_resize(i)
    return `0x${this.hex_slice(this.address_offset(i), AddressBuffer.address_length)}`
  }

  price_at(i) {
    this.try_resize(i)
    let hex_price = this.hex_slice(this.price_offset(i), AddressBuffer.price_length)
    return new BigNumber(hex_price, 16)
  }

  update_pixel(pixel) {
    this.set_address_at(pixel.index, pixel.owner).set_price_at(pixel.index, pixel.price)
  }

  set_price_at(i, price) {
    this.try_resize(i)
    let byte_array = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    for(var j = AddressBuffer.price_length - 1; j >= 0; j--) {
      var byte = price.mod(256).toNumber()
      byte_array[j] = byte
      price = price.sub(byte).div(256)
      if (price.isZero())
        break;
    }
    this.buffer.set(byte_array, this.price_offset(i))
    return this
  }

  set_address_at(i, address) {
    this.try_resize(i)
    let byte_array = new Array(AddressBuffer.address_length)
    address = address.substr(2, AddressBuffer.address_length)
    for (var j = 0; j < AddressBuffer.address_length; j++)
      byte_array[j] = parseInt(address.substr(j * 2, 2), 16)
    this.buffer.set(byte_array, this.address_offset(i))
    return this
  }

  try_resize(i) {
    if (this.address_offset(i) < this.buffer.byteLength)
      return
    let new_raw_buffer = new ArrayBuffer(this.address_offset(i + AddressBuffer.resize_chunk_size))
    this.raw_buffer = new_raw_buffer
    let new_buffer = new Uint8Array(new_raw_buffer)
    new_buffer.set(this.buffer)
    this.buffer = new_buffer
  }

  address_offset(i) {
    return i * AddressBuffer.entry_size
  }

  price_offset(i) {
    return this.address_offset(i) + AddressBuffer.address_length
  }

  hex_slice(start, length) {
    return this.buffer.slice(start, start + length).reduce((out, byte) => {
      return out + byte.toString(16).padStart(2, '0')
    }, '')
  }

  static decompress_buffer(deflated) {
    return new Promise((resolve, reject) => {
      zlib.inflateRaw(new Buffer(deflated), (err, result) => {
        if (err)
          reject(err)
        else
          resolve(result)
      })
    })
  }
}

export default AddressBuffer