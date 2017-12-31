import React, { Component } from 'react'

class CoordPicker extends React.Component {
  render() {
    return (
      <div>
        <p>{this.props.label}</p>
        <input type='number' min={this.props.min} max={this.props.max} value={this.props.value} onChange={this.props.onChange}></input>
      </div>
    )
  }
}

export default CoordPicker