import React, { Component } from 'react'
import CanvasUtils from './utils/CanvasUtils'
import WheelUtils from './utils/WheelUtils'
import './Canvas.css'

class Canvas extends Component {
  componentDidMount() {
    this.ctx = CanvasUtils.getContext(this.canvas, this.props.aliasing)
    this.clear()
    if (this.props.on_mouse_move)
      this.canvas.addEventListener('mousemove', this.props.on_mouse_move)
    if (this.props.on_mouse_down)
      this.canvas.addEventListener('mousedown', this.props.on_mouse_down)
    if (this.props.on_mouse_up)
      this.canvas.addEventListener('mouseup', this.props.on_mouse_up)
    if (this.props.on_mouse_click)
      this.canvas.addEventListener('click', this.props.on_mouse_click)
    if (this.props.on_mouse_wheel)
      WheelUtils.events.forEach((e) => { this.canvas.addEventListener(e, this.props.on_mouse_wheel) })
  }
  
  componentWillUnmount() {
    if (this.props.on_mouse_move)
      this.canvas.removeEventListener('mousemove', this.props.on_mouse_move)
    if (this.props.on_mouse_down)
      this.canvas.removeEventListener('mousedown', this.props.on_mouse_down)
    if (this.props.on_mouse_up)
      this.canvas.removeEventListener('mouseup', this.props.on_mouse_up)
    if (this.props.on_mouse_click)
      this.canvas.removeEventListener('click', this.props.on_mouse_click)
    if (this.props.on_mouse_wheel)
      WheelUtils.events.forEach((e) => { this.canvas.removeEventListener(e, this.props.on_mouse_wheel) })
  }
  
  clear(background) {
    if (background)
      this.drawImage(background, 0, 0, this.canvas.width, this.canvas.height)
    else
      CanvasUtils.clear(this.ctx, 'white', this.props)
  }

  drawImage(...args) {
    this.ctx.drawImage(...args)
  }

  outline(x, y, width, height) {
    let center_x = x + 0.5 * width
    let center_y = y + 0.5 * height
    let gradient = this.ctx.createRadialGradient(center_x, center_y, width, center_x, center_y, 0)
    gradient.addColorStop(0.3,"white")
    gradient.addColorStop(0.4,"green")
    gradient.addColorStop(0.47,"blue")
    gradient.addColorStop(0.5,"red")
    this.ctx.strokeStyle = gradient
    this.ctx.strokeRect(x, y, width, height)
  }
  
  putImageData(...args) {
    this.ctx.putImageData(...args)
  }

  transform(...args) {
    this.ctx.transform(...args)
  }

  set_transform(...args) {
    this.ctx.setTransform(...args)
  }

  save() {
    this.ctx.save()
  }

  restore() {
    this.ctx.restore()
  }
  
  render() {
    return (
      <canvas className={this.props.className} width={this.props.width} height={this.props.height} ref={(c) => {this.canvas = c}}></canvas>
    )
  }
}

export default Canvas