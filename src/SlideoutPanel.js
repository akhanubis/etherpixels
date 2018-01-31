import React, { Component } from 'react'
import './SlideoutPanel.css'

class SlideoutPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      events_tab_hovered: false
    }
  }
  
  tab_style() {
    let right = 290
    if (!this.props.expand)
      right = this.state.events_tab_hovered ? 0 : -10
    return { right: right }
  }

  inner_style() {
    let right = this.props.expand ? 0 : -290
    return { right: right }
  }

  start_hover_events_tab(e) {
    e.preventDefault()
    this.setState({ events_tab_hovered: true })
  }

  stop_hover_events_tab(e) {
    e.preventDefault()
    this.setState({ events_tab_hovered: false })
  }

  render() {
    return (
      <div className="slideout" onClick={this.props.on_tab_click} onMouseEnter={this.start_hover_events_tab.bind(this)} onMouseLeave={this.stop_hover_events_tab.bind(this)} style={this.tab_style()}>
        <div className="slideout-tab-text">{this.props.expand ? 'Close' : 'Events'}</div>
        <div className="slideout-inner" style={this.inner_style()}>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default SlideoutPanel