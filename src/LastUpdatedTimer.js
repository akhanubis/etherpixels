import React, { PureComponent } from 'react'

class LastUpdatedTimer extends PureComponent {
  componentDidMount = () => this.interval = setInterval(this.tick, 1000)

  componentWillUnmount = () => clearInterval(this.interval)

  tick = () => this.setState({ current_time: new Date() })

  elapsed_seconds = () => Math.floor((this.state.current_time.getTime() - this.props.last_updated.getTime()) / 1000)

  render() {
    if (this.props.last_updated)
      return <span> (received {this.elapsed_seconds()} secs ago)</span>
    else
      return null
  }
}

export default LastUpdatedTimer