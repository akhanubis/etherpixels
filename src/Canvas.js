import React from 'react'
import CanvasUtils from './utils/CanvasUtils'

class Canvas extends React.Component {  
  componentDidMount() {
    this.ctx = CanvasUtils.getContext(this.canvas, this.props.aliasing)
    CanvasUtils.clear(this.ctx, 'gray', this.props)
    if (this.props.on_mouse_move)
      this.canvas.addEventListener('mousemove', this.props.on_mouse_move)
    if (this.props.on_mouse_click)
      this.canvas.addEventListener('click', this.props.on_mouse_click)
  }
  
  componentWillUnmount() {
    if (this.props.on_mouse_move)
      this.canvas.removeEventListener('mousemove', this.props.on_mouse_move)
    if (this.props.on_mouse_click)
      this.canvas.removeEventListener('click', this.props.on_mouse_click)
  }
  
  drawImage(...args) {
    this.ctx.drawImage(...args)
  }
  
  putImageData(...args) {
    this.ctx.putImageData(...args)
  }
  
  render() {
    return (
      <canvas className={this.props.className} width={this.props.width} height={this.props.height} ref={(c) => {this.canvas = c}}></canvas>
    )
  }
}

export default Canvas