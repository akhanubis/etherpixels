import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import './Footer.css'

class Footer extends Component {
  render() {
    if (this.props.pixel)
      return (
        <footer className="footer">
          <div className="container-fluid pixel-status">
            <PixelSquare color={this.props.pixel.color} />
            <span className="text-muted">({this.props.pixel.x}, {this.props.pixel.y}) for {this.props.pixel.price.toNumber()} wei owned by {this.props.pixel.owner}</span>
          </div>
        </footer>
    )
    else
      return null
  }
}

export default Footer