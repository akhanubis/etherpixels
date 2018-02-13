import React, { PureComponent } from 'react'
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
    let title = `Tx ${tx.hash.substr(0, 7)}...`
    return React.createElement(PixelBatch, { on_toggle: this.on_toggle, expanded: active === tx.hash, key: tx.hash, panel_key: tx.hash, title: title, batch: tx.pixels, explorer_link: true, current_block: this.props.current_block })
  }

  render_txs = (txs, active) => {
    this.rendered_txs = txs.map(tx => this.tx_element(tx, active))
  }

  render() {
    let logs = this.rendered_txs.length ? this.rendered_txs : 'Listening for new transactions...'
    return (
      <div className="tx-panel-container">
          {logs}
      </div>
    )
  }
}

export default EventLog