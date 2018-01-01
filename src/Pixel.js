import React, { Component } from 'react'
import { Rect } from "react-konva";

class Pixel extends React.Component {
  constructor(props) {
    super(props)
    this.pixel_size = 30
    this.timer_required = !!props.pixel.timer_required()
    this.state = {
      x: (props.canvas_size_x - this.pixel_size) / 2 + this.pixel_size * props.pixel.x,
      y: (props.canvas_size_y - this.pixel_size) / 2 + this.pixel_size * props.pixel.y,
      color_index: 0,
      pixel: props.pixel
    }
  }
  
  nextColor = () => {
    this.setState(prev_state => {
      return { color_index: (prev_state.color_index + 1) % this.props.pixel.colors.length }
    })
  }
  
  current_color() {
    return this.props.pixel.colors[this.state.color_index]
  }
  
  componentDidMount() {
    if (this.timer_required)
      this.props.pixel.timer_reference.event_ref.addEventListener('tick', this.nextColor.bind(this))
  }
  
  componentWillUnmount() {
    if (this.timer_required)
      this.props.pixel.timer_reference.event_ref.removeEventListener('tick', this.nextColor)
  }
  
  render() {
    return (
      <Rect
        x={this.state.x}
        y={this.state.y}
        width={this.pixel_size}
        height={this.pixel_size}
        fill={this.current_color()}
        onClick={false}
      />
    )
  }
}

export default Pixel