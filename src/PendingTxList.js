import React, { PureComponent } from 'react'
import PixelBatch from './PixelBatch'
import { FormGroup, Checkbox, PanelGroup } from 'react-bootstrap'
import './PendingTxList.css'

class PendingTxList extends PureComponent {
  constructor(props) {
    super(props)
    this.weak_map_for_keys = new WeakMap()
    this.weak_map_count = 0
    this.state = {
      active_key: 'draft'
    }
  }

  handle_select = new_key => this.setState({ active_key: new_key })

  total_price = () => {
    let total_pixels = this.props.pending_txs.reduce((total, tx) => total.concat(tx.pixels), [])
    return this.props.gas_estimator.estimate_total(total_pixels)
  }

  key_for_tx = tx => {
    if (!this.weak_map_for_keys.has(tx))
      this.weak_map_for_keys.set(tx, ++this.weak_map_count)
    return this.weak_map_for_keys.get(tx)
  }

  txs_list = () => {
    return this.props.pending_txs.map(tx => {
      let key = this.key_for_tx(tx)
      return React.createElement(PixelBatch, { current_panel: this.state.active_key /* trigger a render so collapsing works*/, key: key, panel_key: key.toString(), title: `Tx #${key}`, batch: tx.pixels, gas_estimator: this.props.gas_estimator })
    }).reverse()
  }

  custom_height = () => {
    return { height: `calc(100% - ${this.props.palette_height}px - 40px - 90px)`}
  }

  render() {
    return (
      <div className='pending-txs-container' style={this.custom_height()}>
        <FormGroup>
          <Checkbox inline checked={this.props.preview} onChange={this.props.on_preview_change}> Show preview </Checkbox>
        </FormGroup>
        <PanelGroup accordion id="pending_txs" activeKey={this.state.active_key} onSelect={this.handle_select}>
          {React.cloneElement(this.props.children, { current_panel: this.state.active_key })}
          {this.txs_list()}
        </PanelGroup>
      </div>
    )
  }
}

export default PendingTxList