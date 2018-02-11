import React, { PureComponent } from 'react'
import LastUpdatedTimer from './LastUpdatedTimer'
import './BlockInfo.css'

class BlockInfo extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      last_updated: new Date()
    }
  }

  componentWillReceiveProps(new_props) {
    if (new_props.current !== this.props.current)
      this.setState({ last_updated: new Date() })
  }

  render() {
    return (
      <div className="block-info">
        <p>Genesis block: {this.props.genesis}</p>
        <p>
          Blocknumber: {this.props.current}
          <LastUpdatedTimer last_updated={this.state.last_updated} />
        </p>
        <p>Pixel supply: {this.props.max_index + 1}</p>
      </div>
    )
  }
}

export default BlockInfo