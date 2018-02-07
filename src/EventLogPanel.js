import React, { PureComponent } from 'react'
import EventLog from './EventLog'
import './EventLogPanel.css'

class EventLogPanel extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      events_tab_hovered: false
    }
    this.hover_distance = 10
  }
  
  tab_style = () => {
    let right = this.props.slideout_width
    if (!this.props.expand)
      right = this.state.events_tab_hovered  && !this.hover_disabled? 0 : - this.hover_distance
    return { right: right }
  }

  inner_style = () => {
    let right = this.props.expand ? 0 : - this.props.slideout_width
    return { right: right }
  }

  start_hover_events_tab = e => {
    e.preventDefault()
    if (!this.hover_disabled)
      this.setState({ events_tab_hovered: true })
  }

  stop_hover_events_tab = e => {
    e.preventDefault()
    this.setState({ events_tab_hovered: false })
  }

  enable_hover = () => {
    this.hover_disabled = false
  }

  click_tab = e => {
    e.preventDefault()
    this.hover_disabled = true
    setTimeout(this.enable_hover, 300)
    this.props.on_tab_click()
  }

  render() {
    return (
      <div>
        <div className="slideout" onClick={this.click_tab} onMouseEnter={this.start_hover_events_tab} onMouseLeave={this.stop_hover_events_tab} style={this.tab_style()}>
          <div className="slideout-tab-text">{this.props.expand ? 'Close' : 'Events'}</div>
        </div>
        <div className="slideout-inner" style={this.inner_style()}>
          <EventLog txs={this.props.event_logs} on_clear={this.props.on_clear} cooldown_formatter={this.props.cooldown_formatter} />
        </div>
      </div>
    )
  }
}

export default EventLogPanel