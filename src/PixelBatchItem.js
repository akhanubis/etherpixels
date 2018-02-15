import React, { PureComponent } from 'react'
import PixelSquare from './PixelSquare'
import CooldownFormatter from './utils/CooldownFormatter'
import './PixelBatchItem.css'

class PixelBatchItem extends PureComponent {
  lock_info = () => {
    if (this.props.current_block | this.props.cooldown)
      return (
        <span className='right-text'>
          <span className="glyphicon glyphicon-lock" />
          {this.props.cooldown? this.props.cooldown : CooldownFormatter.short_format(this.props.pixel.locked_until)}
        </span>
      )
    else
      return null
  }

  render() {
    return (
      <div className='batch-pixel-info'>
        <PixelSquare color={this.props.pixel.old_color} />
        <span className='text'>=></span>
        <PixelSquare color={this.props.pixel.color} />
        <span className='text'>({this.props.pixel.x}, {this.props.pixel.y}) {this.props.pixel.painted === false ? 'failed' : ''}</span>
        {this.lock_info()}
      </div>
    )
  }
}

export default PixelBatchItem