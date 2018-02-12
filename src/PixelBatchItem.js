import React, { PureComponent } from 'react'
import PixelSquare from './PixelSquare'
import './PixelBatchItem.css'

class PixelBatchItem extends PureComponent {
  render() {
    return (
      <div className='batch-pixel-info'>
        <PixelSquare color={this.props.pixel.old_color} />
        <span className='text'>=></span>
        <PixelSquare color={this.props.pixel.color} />
        <span className='text'>({this.props.pixel.x}, {this.props.pixel.y}) {this.props.pixel.painted === false ? 'failed' : ''}</span>
      </div>
    )
  }
}

export default PixelBatchItem