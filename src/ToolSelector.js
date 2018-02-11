import React, { PureComponent } from 'react'
import { Button, ButtonToolbar, Tooltip, OverlayTrigger } from 'react-bootstrap'
import './ToolSelector.css'

class Tool extends PureComponent {
  select = e => {
    e.preventDefault()
    this.props.on_tool_selected(this.props.id)
  }

  selected = () => this.props.current_tool === this.props.id

  labels = {
      paint: 'Paint',
      move: 'Move',
      erase: 'Erase',
      pick_color: 'Pick color',
      fullscreen: 'Fullscreen'
  }

  label = () => this.labels[this.props.id]

  tooltip = (
    <Tooltip id="tooltip">
      {this.label()} ({this.props.shortcuts[this.props.id]})
    </Tooltip>
  )

  render() {
    return (
      <OverlayTrigger placement="top" overlay={this.tooltip}>
        <Button bsStyle="primary" active={this.selected()} onClick={this.select} >{this.label()}</Button>
      </OverlayTrigger>
    )
  }
}

class ToolSelector extends PureComponent {
  tools = () => {
    return this.props.tools.map(t => React.createElement(Tool, { key: t, current_tool: this.props.current_tool, shortcuts: this.props.shortcuts, id: t, on_tool_selected: this.props.on_tool_selected }))
  }
  render() {
    return (
      <ButtonToolbar className='tools'>
        {this.tools()}
      </ButtonToolbar>
    )
  }
}

export default ToolSelector