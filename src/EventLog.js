import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import { Button } from 'react-bootstrap'
import './EventLog.css'

class EventLog extends Component {
  render() {
    let logs = null
    if (this.props.event_logs.length)
      logs = this.props.event_logs.map((p, i) => {
        return (
          <a target="_blank" key={i} href={`https://etherscan.io/tx/${p.tx}`}>
            <div className='event-info'>
              <PixelSquare color={p.old_color} />
              <span className='text'>=></span>
              <PixelSquare color={p.color} />
              <span className='text'>({p.x}, {p.y}) for {p.price}</span>
            </div>
          </a>
        )
      })
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