import React from 'react'
import PixelSquare from './PixelSquare'

class NewPixelEvent {
  constructor(coords) {
    this.x = coords.x
    this.y = coords.y
  }
  
  render(i) {
    // TODO: hacer clickeable las coords para centrar en el pixel
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
    // TODO: hacer clickeable para centrar en el pixel o ver info
    return (
      <div className='event-info' key={i}>
        <PixelSquare color={this.pixel.old_color} />
        <span className='text'>=></span>
        <PixelSquare color={this.pixel.color} />
        <span className='text'>({this.pixel.x}, {this.pixel.y}) for {this.pixel.price.toNumber()} wei</span>
        <div className='right-link'>
          <a target="_blank" href={`https://etherscan.io/tx/${this.pixel.tx}`}>
            view on explorer
          </a>
        </div>
      </div>
    )
  }
}

export { NewPixelEvent, PixelSoldEvent }