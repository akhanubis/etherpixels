import EnvironmentManager from './utils/EnvironmentManager'
import zlib from 'zlib'

class AddressBuffer {
  static get entry_size() { return 24 }
  static get address_length() { return 20 }
  static get address_in_words_length() { return 5 }
  static get word_size() { return 4 }
  static get locked_until_length() { return 4 }
  static get resize_chunk_size() { return 240 } /* in entries amount */

  constructor(buffer) {
    this.raw_buffer = buffer
    this.buffer = new DataView(this.raw_buffer)
    this.confirmations_needed = EnvironmentManager.get('REACT_APP_CONFIRMATIONS_NEEDED')
  }

  entry_at(i) {
    this.try_resize(i)
    return {
      address: this.address_at(i),
      locked_until: this.locked_until_at(i)
    }
  }
  
  update_pixel(pixel) {
    this.set_address_at(pixel.index, pixel.owner).set_locked_until_at(pixel.index, pixel.locked_until)
  }

  set_locked_until_at(i, locked_until) {
    this.try_resize(i)
    this.buffer.setUint32(this.locked_until_offset(i), locked_until, false)
    return this
  }

  set_address_at(i, address) {
    this.try_resize(i)
    let starting_offset = this.address_offset(i)
    address = address.substr(2, AddressBuffer.address_length * 2) /* 2 hex chars per byte */
    for (var j = 0; j < AddressBuffer.address_in_words_length; j++)
      this.buffer.setUint32(starting_offset + j * AddressBuffer.word_size, parseInt(address.substr(j * 8, 8), 16), false)
    return this
  }

  address_at(i) {
    let words = [], starting_offset = this.address_offset(i)
    for(var j = 0; j < AddressBuffer.address_in_words_length; j++)
      words.push(this.buffer.getUint32(starting_offset + j * AddressBuffer.word_size, false))
    return words.reduce((out, word) => {
      return `${out}${word.toString(16).padStart(8, '0')}`
    }, '0x')
  }

  locked_until_at(i) {
    return this.buffer.getUint32(this.locked_until_offset(i), false) - this.confirmations_needed
  }

  try_resize(i) {
    if (this.address_offset(i) < this.buffer.byteLength)
      return
    let temp_old = new Uint8Array(this.raw_buffer)
    this.raw_buffer = new ArrayBuffer(this.address_offset(i + AddressBuffer.resize_chunk_size))
    let temp_new = new Uint8Array(this.raw_buffer)
    temp_new.set(temp_old)
    this.buffer = new DataView(this.raw_buffer)
  }

  address_offset(i) {
    return i * AddressBuffer.entry_size
  }

  locked_until_offset(i) {
    return this.address_offset(i) + AddressBuffer.address_length
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