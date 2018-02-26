import React, { PureComponent } from 'react'
import { CirclePicker, PhotoshopPicker } from 'react-color'
import { Col, Grid, OverlayTrigger, Popover, Badge } from 'react-bootstrap'
import { ResizeSensor } from 'css-element-queries'
import ColorUtils from './utils/ColorUtils'

import './Palette.css'

class Palette extends PureComponent {
  constructor(props) {
    super(props)
    this.default_colors = ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b"]
    this.state = {
      current_height: null
    }
  }

  componentDidMount() {
    new ResizeSensor(this.palette_resize_sensor, this.update_container_height)
    this.update_container_height()
  }

  update_container_height = () => this.props.on_height_change(this.palette_resize_sensor.clientHeight + 1)

  hide_color_picker = () => {
    this.color_picker_popover.hide()
    this.setState({ current_custom_color: null })
  }

  update_current_custom_color = new_color => this.setState({ current_custom_color: new_color})

  save_custom_color = () => {
    let color_to_add = this.state.current_custom_color || { hex: ColorUtils.rgbaToHex(this.props.current_color), rgb: { ...this.props.current_color, a: 1 }} /* custom color is nil if the user didn't trigger a change */
    this.props.on_custom_color_save(color_to_add.hex)
    this.props.on_color_update(color_to_add)
  }

  add_custom_color = () => {
    this.save_custom_color()
    this.hide_color_picker()
  }

  end_remove_custom_color = () => this.setState({ removing_custom_color: false })

  toggle_remove_custom_color = () => this.setState(prev_state => ({ removing_custom_color: !prev_state.removing_custom_color }))

  click_custom_color = color => {
    if (this.state.removing_custom_color) {
      this.end_remove_custom_color()
      this.props.on_custom_color_remove(color.hex)
    }
    else
      this.props.on_color_update(color)
  }

  render() {
    let advanced_color_picker = (
      <Popover id="advanced_color_pickercolor" bsStyle="color-picker">
        <PhotoshopPicker
          color={ this.state.current_custom_color || this.props.current_color }
          onChangeComplete={this.update_current_custom_color}
          onAccept={this.add_custom_color}
          onCancel={this.hide_color_picker}
        />
      </Popover>
    )
    return (
      <div className="resizing-sensor color-picker-container" ref={rs => this.palette_resize_sensor = rs}>
        <Grid fluid={true}>
          <Col md={12}>
            <p>Pick a color</p>
            <CirclePicker
              width="100%"
              color={ this.props.current_color }
              onChangeComplete={ this.props.on_color_update }
              colors={this.default_colors}
            />
            <p className="custom-colors-title">Custom colors</p>
            <div className="custom-colors-badges">
              <OverlayTrigger onClick={this.end_remove_custom_color} trigger="click" overlay={advanced_color_picker} placement="right" ref={ot => this.color_picker_popover = ot} >
                <Badge className="add">+ Add</Badge>
              </OverlayTrigger>
              {this.props.custom_colors.length ? <Badge onClick={this.toggle_remove_custom_color} className={`remove ${this.state.removing_custom_color ? 'active' : ''}`}>- Remove</Badge> : '' }
            </div>
            <CirclePicker className={this.state.removing_custom_color ? 'custom-colors-removing' : ''}
              width="100%"
              color={ this.props.current_color }
              onChangeComplete={ this.click_custom_color }
              colors={this.props.custom_colors}
            />
          </Col>
        </Grid>
      </div>
    )
  }
}

export default Palette