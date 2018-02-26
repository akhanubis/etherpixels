import React, { PureComponent } from 'react'
import ColorUtils from './utils/ColorUtils'
import './PixelSquare.css'

class PixelSquare extends PureComponent {
  background = () => {
    if (this.props.color.a)
      return { backgroundColor: ColorUtils.rgbaToString(this.props.color)}
    else
      return { backgroundImage: "url('/assets/blank-pixel.png')", backgroundRepeat: 'no-repeat' }
  }
  
  render() {
    return <div className="pixel-square" style={this.background()}></div>
  }
}

export default PixelSquare