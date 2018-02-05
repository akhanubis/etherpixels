import React, { PureComponent } from 'react'
import { CirclePicker, MaterialPicker, PhotoshopPicker } from 'react-color'
import { Col, Grid, Button, OverlayTrigger, Popover } from 'react-bootstrap'
import ToolSelector from './ToolSelector'
import './Palette.css'

class Palette extends PureComponent {
  constructor(props) {
    super(props)
    this.default_colors = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"]
  }

  hide_color_picker() {
    this.color_picker_popover.hide()
  }

  update_current_custom_color(new_color) {
    this.current_custom_color = new_color
  }

  save_custom_color() {
    this.props.on_custom_color_save(this.current_custom_color.hex)
  }

  add_custom_color() {
    this.hide_color_picker()
    this.save_custom_color()
    this.props.on_color_update(this.current_custom_color)
  }

  render() {
    let advanced_color_picker = (
      <Popover id="advanced_color_pickercolor" bsStyle="color-picker">
        <PhotoshopPicker
          color={ this.props.current_color }
          onChangeComplete={this.update_current_custom_color.bind(this)}
          onAccept={this.add_custom_color.bind(this)}
          onCancel={this.hide_color_picker.bind(this)}
        />
      </Popover>
    )
    return (
      <div className="color-picker-container">
        <Grid fluid={true}>
          <Col md={8}>
            <Grid fluid={true}>
              <CirclePicker color={ this.props.current_color }
                onChangeComplete={ this.props.on_color_update }
                colors={this.default_colors}
              />
              <p>Custom colors</p>
              <CirclePicker color={ this.props.current_color }
                onChangeComplete={ this.props.on_color_update }
                colors={this.props.custom_colors}
              />
              <Col md={4}>
                <OverlayTrigger trigger="click" overlay={advanced_color_picker} placement="right" ref={ot => this.color_picker_popover = ot} >
                  <Button bsStyle="primary" block={true}>Add</Button>
                </OverlayTrigger>
              </Col>
              <Col md={4}>
                <Button bsStyle="primary" block={true} onClick={this.props.on_custom_colors_clear}>Clear</Button>
              </Col>
              <Col md={4}>
                <ToolSelector tools={this.props.tools} on_tool_selected={this.props.on_tool_selected} current_tool={this.props.current_tool} shortcuts={this.props.shortcuts} />
              </Col>
            </Grid>
          </Col>
          <Col md={4}>
            <MaterialPicker
              color={ this.props.current_color }
              onChangeComplete={ this.props.on_color_update }
            />
          </Col>
        </Grid>
      </div>
    )
  }
}

export default Palette