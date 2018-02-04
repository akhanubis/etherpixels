import React, { PureComponent } from 'react'
import PixelSquare from './PixelSquare'

class PixelPaintedEvent extends PureComponent {
  render() {
    return (
      <div className='event-info'>
        <PixelSquare color={this.props.pixel.old_color} />
        <span className='text'>=></span>
        <PixelSquare color={this.props.pixel.color} />
        <span className='text'>({this.props.pixel.x}, {this.props.pixel.y}) {this.props.cooldown_formatter.format(this.props.pixel.locked_until)}</span>
        <div className='right-link'>
          <a target="_blank" href={`https://etherscan.io/tx/${this.props.pixel.tx}`}>
            view on explorer
          </a>
        </div>
      </div>
    )
  }
}

export default PixelPaintedEvent