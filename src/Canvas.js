import React from 'react'
import CanvasUtils from './utils/CanvasUtils'
import WheelUtils from './utils/WheelUtils'

class Canvas extends React.Component {


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
  
  clear() {
    CanvasUtils.clear(this.ctx, 'gray', this.props)
  }

  drawImage(...args) {
    this.ctx.drawImage(...args)
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