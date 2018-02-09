import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import NameUtils from './utils/NameUtils'
import './HoverInfo.css'

class HoverInfo extends Component {
  /* diff and (one of them is undefined or they don't have the same coords */
  shouldComponentUpdate = next_props => next_props.pixel !== this.props.pixel && (!next_props.pixel || !this.props.pixel || !next_props.pixel.same_coords(this.props.pixel))

  render() {
    if (this.props.pixel) {
      let ownage = this.props.pixel.is_new() ? '' : ` painted by ${NameUtils.name(this.props.pixel.owner)}`
      return (
        <div className="footer hover-info">
          <div className="container-fluid pixel-status">
            <PixelSquare color={this.props.pixel.color} />
            <span className="text-muted">({this.props.pixel.x}, {this.props.pixel.y}) {this.props.cooldown_formatter.format(this.props.pixel.locked_until)}{ownage}</span>
          </div>
        </div>
    )}
    else
      return null
  }
}

export default HoverInfo