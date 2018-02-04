import React, { PureComponent } from 'react'
import './EventLog.css'

class EventLog extends PureComponent {
  render() {
    let logs = this.props.event_logs.length ? this.props.event_logs : 'Listening for new events...'
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