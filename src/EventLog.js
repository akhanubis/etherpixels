import React, { Component } from 'react'
import './EventLog.css'

class EventLog extends Component {
  render() {
    let logs = null
    if (this.props.event_logs.length)
      logs = this.props.event_logs.map((event, i) => { return event.render(i) })
    else
      logs = "Listening for new events..."
    return (
      <div className="events-container">
        <h4>
          <span>Latest events</span>
          <div className='clear' onClick={this.props.on_clear}>clear</div>
        </h4>
        <div className="events-list">
          {logs}
        </div>
      </div>
    )
  }
}

export default EventLog