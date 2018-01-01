import React, { Component } from 'react'
import { Stage, Layer } from "react-konva"
import Pixel from './Pixel'

class CanvasContainer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {height: 0, width: 0}
  }

  componentDidMount() {
    window.addEventListener('resize', this.resetDimensions.bind(this))
    setTimeout(() => { this.resetDimensions() }, 1)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resetDimensions)
  }

  resetDimensions() {
    var canvasContainer = this.canvasContainer
    this.setState({width: canvasContainer.clientWidth, height: canvasContainer.clientHeight})
  }
  
  render() {
    let pixels = this.props.pixels.map(p => {
      return <Pixel pixel={p} canvas_size_x={this.state.width} canvas_size_y={this.state.height}/>
    })
    return (
      <div style={{backgroundColor: 'grey', border: 'solid 1px black', width: '500px', height: '800px', display: 'block'}} ref={(input) => { this.canvasContainer = input }}>
        <Stage width={this.state.width} height={this.state.height}>
          <Layer>                
            {pixels}
          </Layer>
        </Stage>
      </div>
    )
  }
}

export default CanvasContainer