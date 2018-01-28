import React from 'react'
import PixelSquare from './PixelSquare'

class NewPixelEvent {
  constructor(coords) {
    this.x = coords.x
    this.y = coords.y
    this.key = `0_${coords.x}_${coords.y}`
  }
  
  render() {
    // TODO: hacer clickeable las coords para centrar en el pixel
    return (
      <div key={this.key}>
        New pixel available at ({this.x}, {this.y})
      </div>
    )
  }
}

class PixelPaintedEvent {
  constructor(pixel) {
    this.pixel = pixel
    this.key = `${pixel.tx}_${pixel.x}_${pixel.y}`
  }
  
  render(cd_formatter) {
    // TODO: hacer clickeable para centrar en el pixel o ver info
    return (
      <div className='event-info' key={this.key}>
        <PixelSquare color={this.pixel.old_color} />
        <span className='text'>=></span>
        <PixelSquare color={this.pixel.color} />
        <span className='text'>({this.pixel.x}, {this.pixel.y}) {cd_formatter.format(this.pixel.locked_until)}</span>
        <div className='right-link'>
          <a target="_blank" href={`https://etherscan.io/tx/${this.pixel.tx}`}>
            view on explorer
          </a>
        </div>
      </div>
    )
  }
}

export { NewPixelEvent, PixelPaintedEvent }