import React, { Component } from 'react'

class Timer extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      secondsElapsed: 0
    }
    this.tick_event = new Event('tick')
  }
  
  tick() {
    this.setState((prev_state) => { return {secondsElapsed: prev_state.secondsElapsed + 1 } })
    this.event_ref.dispatchEvent(this.tick_event)
  }
  
  componentDidMount() {
    this.interval = setInterval(this.tick.bind(this), 1000)
  }
  
  componentWillUnmount() {
    clearInterval(this.interval)
  }
  
  render() { return <div ref={(e) => {this.event_ref = e }} ></div> }
}

export default Timer