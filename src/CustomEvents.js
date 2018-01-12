import React from 'react'
import PixelSquare from './PixelSquare'

class NewPixelEvent {
  constructor(coords) {
    this.x = coords.x
    this.y = coords.y
  }
  
  render(i) {
    return (
      <div key={i}>
        New pixel available at ({this.x}, {this.y})
      </div>
    )
  }
}

class PixelSoldEvent {
  constructor(pixel) {
    this.pixel = pixel
  }
  
  render(i) {
    return (
      <a target="_blank" key={i} href={`https://etherscan.io/tx/${this.pixel.tx}`}>
        <div className='event-info'>
          <PixelSquare color={this.pixel.old_color} />
          <span className='text'>=></span>
          <PixelSquare color={this.pixel.color} />
          <span className='text'>({this.pixel.x}, {this.pixel.y}) for {this.pixel.price}</span>
        </div>
      </a>
    )
  }
}

export { NewPixelEvent, PixelSoldEvent }