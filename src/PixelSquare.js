import React, { Component } from 'react'
import './PixelSquare.css'

class PixelSquare extends Component {
  render() {
    return <div className="pixel-square" style={{ backgroundColor: this.props.color}}></div>
  }
}

export default PixelSquare