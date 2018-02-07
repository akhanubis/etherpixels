import React, { PureComponent } from 'react'
import { PanelGroup } from 'react-bootstrap'
import PixelBatch from './PixelBatch'
import './EventLog.css'

class EventLog extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      active_key: null
    }
    this.rendered_txs = []
  }

  componentWillUpdate(next_props, next_state) {
    this.render_txs(next_props.txs, next_state.active_key)
  }

  on_toggle = (toggled_key, expand) => {
    this.setState({ active_key: expand ? toggled_key : null })
  }

  tx_element = (tx, active) => {
    let title = `Tx ${tx.tx.substr(0, 7)}...${tx.tx.substr(62, 5)}`
    return React.createElement(PixelBatch, { on_toggle: this.on_toggle, expanded: active === tx.tx, key: tx.tx, panel_key: tx.tx, title: title, batch: tx.pixels, link: true })
  }

  render_txs = (txs, active) => {
    this.rendered_txs = txs.map(tx => this.tx_element(tx, active))
  }

  render() {
    let logs = this.rendered_txs.length ? this.rendered_txs : 'Listening for new transactions...'
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