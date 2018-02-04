import React, { PureComponent } from 'react'
import './PixelSquare.css'

class PixelSquare extends PureComponent {
  render() {
    return <div className="pixel-square" style={{ backgroundColor: this.props.color}}></div>
  }
}

export default PixelSquare