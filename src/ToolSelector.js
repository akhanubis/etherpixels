import React, { PureComponent } from 'react'
import { Button, ButtonToolbar, Tooltip, OverlayTrigger } from 'react-bootstrap'
import './ToolSelector.css'

class Tool extends PureComponent {
  select = e => {
    e.preventDefault()
    this.props.on_tool_selected(this.props.id)
  }

  selected = () => this.props.current_tool === this.props.id

  tooltip = (
    <Tooltip id="tooltip">
      Shortcut {this.props.shortcuts[this.props.id]}
    </Tooltip>
  )

  render() {
    return (
      <OverlayTrigger placement="top" overlay={this.tooltip}>
        <Button bsStyle="primary" active={this.selected()} onClick={this.select} >{this.props.label}</Button>
      </OverlayTrigger>
    )
  }
}

class ToolSelector extends PureComponent {
  render() {
    return (
      <ButtonToolbar>
        <Tool current_tool={this.props.current_tool} shortcuts={this.props.shortcuts} label='Paint' id='paint' on_tool_selected={this.props.on_tool_selected} />
        <Tool current_tool={this.props.current_tool} shortcuts={this.props.shortcuts} label='Move' id='move' on_tool_selected={this.props.on_tool_selected} />
        <Tool current_tool={this.props.current_tool} shortcuts={this.props.shortcuts} label='Erase' id='erase' on_tool_selected={this.props.on_tool_selected} />
        <Tool current_tool={this.props.current_tool} shortcuts={this.props.shortcuts} label='Pick color' id='pick_color' on_tool_selected={this.props.on_tool_selected} />
      </ButtonToolbar>
    )
  }
}

export default ToolSelector