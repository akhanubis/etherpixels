import React, { PureComponent } from 'react'
import EventLog from './EventLog'
import { FormGroup, Checkbox } from 'react-bootstrap'
import './EventLogPanel.css'

class EventLogPanel extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      events_tab_hovered: false,
      filtered: false
    }
    this.hover_distance = 10
  }
  
  expand = () => this.props.current_panel === 'events'

  tab_style = () => {
    let right = 0
    if (!this.expand())
      right = this.state.events_tab_hovered  && !this.hover_disabled? 0 : - this.hover_distance
    if (this.props.current_panel)
      right += this.props.panel_width
    return { right: right }
  }

  inner_style = () => {
    let right = this.expand() ? 0 : - this.props.panel_width
    return { right: right, width: this.props.panel_width }
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

  account_label = () => `${this.props.account.substr(0, 7)}...${this.props.account.substr(37, 5)}`

  toggle_filter = () => this.setState(prev_state => ({ filtered: !prev_state.filtered }))

  dummy_fn = _ => true

  filter_fn = l => l.owner === this.props.account

  filtered_logs = () => {
    let filter_fn = this.state.filtered ? this.filter_fn : this.dummy_fn
    return this.props.event_logs.filter(filter_fn)
  }

  render() {
    let filter_html = null
    if (this.props.account)
      filter_html = (
        <FormGroup>
          <Checkbox inline checked={this.state.filtered} onChange={this.toggle_filter}> Limit to {this.account_label()} </Checkbox>
        </FormGroup>
      )
    return (
      <div>
        <div className="slideout" onClick={this.click_tab} onMouseEnter={this.start_hover_events_tab} onMouseLeave={this.stop_hover_events_tab} style={this.tab_style()}>
          <div className="slideout-tab-text">{this.expand() ? 'Close' : 'Events'}</div>
        </div>
        <div className="slideout-inner" style={this.inner_style()}>
          <div className="events-container">
            <h4>
              <span>Latest events</span>
              <div className='clear' onClick={this.props.on_clear}>clear</div>
              {filter_html}
            </h4>
            <EventLog txs={this.filtered_logs()} current_block={this.props.current_block} />
          </div>
        </div>
      </div>
    )
  }
}

export default EventLogPanel