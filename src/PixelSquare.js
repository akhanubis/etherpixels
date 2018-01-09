import React, { Component } from 'react'
import './PixelSquare.css'

class PixelSquare extends Component {
  render() {
    return <div className="pixel-color" style={{ backgroundColor: this.props.pixel.color}}></div>
  }
}

export default PixelSquare