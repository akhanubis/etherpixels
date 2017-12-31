class PixelData {
  constructor(x, y, color_bytes, signature_bytes, owner) {
    this.x = x
    this.y = y
    this.colors = [`#${ color_bytes.substr(2, 6) }`]//TODO: unpack de 32 bytes a array de hex
    this.signature = 'anu estuvo aqui' //TODO: unpack de signature
    this.owner = owner
  }
}

export default PixelData