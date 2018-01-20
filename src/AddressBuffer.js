import zlib from 'zlib'
import BigNumber from 'bignumber.js'

class AddressBuffer {
  static get entry_size() { return 29 }
  static get address_length() { return 20 }
  static get price_length() { return 9 }

  constructor(buffer) {
    this.buffer = new Uint8Array(buffer)
  }

  address_at(i) {
    return this.hex_slice(this.address_offset(i), AddressBuffer.address_length)
  }

  price_at(i) {
    let hex_price = this.hex_slice(this.price_offset(i), AddressBuffer.price_length)
    return new BigNumber(hex_price, 16)
  }

  put_price_at(i, price) {
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

  put_address_at(i, address) {
    let byte_array = new Array(AddressBuffer.address_length)
    for (var j = 0; j < AddressBuffer.address_length; j++)
      byte_array[j] = parseInt(address.substr(j * 2, 2), 16)
    this.buffer.set(byte_array, this.address_offset(i))
    return this
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