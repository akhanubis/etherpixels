import React, { PureComponent } from 'react'
import { Button, ButtonToolbar, Tooltip, OverlayTrigger } from 'react-bootstrap'
import './ToolSelector.css'

class Tool extends PureComponent {
  select = e => {
    e.preventDefault()
    this.props.on_tool_selected(this.props.id)
  }

  selected = () => this.props.current_tool === this.props.id

  static labels = {
    paint: 'Paint',
    move: 'Move',
    erase: 'Erase',
    pick_color: 'Pick color',
    fullscreen: 'Fullscreen',
    reset_view: 'Reset view'
  }

  static icons = {
    paint: 'pencil-alt',
    move: 'arrows-alt',
    erase: 'eraser',
    pick_color: 'eye-dropper',
    fullscreen: 'expand-arrows-alt',
    reset_view: 'image'
  }

  label = () => Tool.labels[this.props.id]

  icon_class = () => `fas fa-${Tool.icons[this.props.id]}`

  tooltip = (
    <Tooltip id="tooltip">
      {this.label()} ({this.props.shortcuts[this.props.id]})
    </Tooltip>
  )

  render() {
    return (
      <OverlayTrigger placement="top" overlay={this.tooltip}>
        <Button bsStyle="primary" active={this.selected()} onClick={this.select} >
          <i className={this.icon_class()} />
        </Button>
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
      <div className="tools-container">
        <p className="tools-title">Tools</p>
        <ButtonToolbar className='tools'>
          {this.tools()}
        </ButtonToolbar>
      </div>
    )
  }
}

export default ToolSelector