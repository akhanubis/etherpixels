import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import PriceFormatter from './utils/PriceFormatter'
import './Footer.css'

class Footer extends Component {
  render() {
    if (this.props.pixel)
      return (
        <footer className="footer">
          <div className="container-fluid pixel-status">
            <PixelSquare color={this.props.pixel.color} />
            <span className="text-muted">({this.props.pixel.x}, {this.props.pixel.y}) for {PriceFormatter.format(this.props.pixel.price)} owned by {this.props.pixel.owner}</span>
          </div>
        </footer>
    )
    else
      return null
  }
}

export default Footer