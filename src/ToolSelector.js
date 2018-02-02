import React, { PureComponent } from 'react'
import { Button, ButtonToolbar } from 'react-bootstrap'
import './ToolSelector.css'

class Tool extends PureComponent {
  select = e => {
    e.preventDefault()
    this.props.on_tool_selected(this.props.id)
  }

  selected = () => this.props.current_tool === this.props.id

  render() {
    return (<Button bsStyle="primary" active={this.selected()} onClick={this.select} >{this.props.label}</Button>)
  }
}

class ToolSelector extends PureComponent {
  render() {
    return (
      <ButtonToolbar>
        <Tool current_tool={this.props.current_tool} label={'Paint'} id={'paint'} on_tool_selected={this.props.on_tool_selected} />
        <Tool current_tool={this.props.current_tool} label={'Move'} id={'move'} on_tool_selected={this.props.on_tool_selected} />
        <Tool current_tool={this.props.current_tool} label={'Erase'} id={'erase'} on_tool_selected={this.props.on_tool_selected} />
        <Tool current_tool={this.props.current_tool} label={'Pick color'} id={'pick_color'} on_tool_selected={this.props.on_tool_selected} />
      </ButtonToolbar>
    )
  }
}

export default ToolSelector