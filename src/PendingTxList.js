import React, { Component } from 'react'
import PixelBatch from './PixelBatch'
import PriceFormatter from './utils/PriceFormatter'
import { FormGroup, Checkbox } from 'react-bootstrap'
import './PendingTxList.css'

class PendingTxList extends Component {
  constructor(props) {
    super(props)
    this.weak_map_for_keys = new WeakMap()
    this.weak_map_count = 0
  }

  total_price() {
    let total_pixels = this.props.pending_txs.reduce((total, tx) => total.concat(tx.pixels), [])
    return this.props.gas_estimator.estimate_total(total_pixels)
  }

  key_for_tx(tx) {
    if (!this.weak_map_for_keys.has(tx))
      this.weak_map_for_keys.set(tx, ++this.weak_map_count)
    return this.weak_map_for_keys.get(tx)
  }

  render() {
    if (this.props.pending_txs.length)
      return (
        <div className='pending-txs-container'>
          <p>Pending txs (total without gas: {PriceFormatter.format(this.total_price())})</p>
          <FormGroup>
            <Checkbox inline checked={this.props.preview} onChange={this.props.on_preview_change}> Show preview </Checkbox>
          </FormGroup>
          <div className='pending-txs-inner-container'>
            {
              this.props.pending_txs.map(tx => {
                return <PixelBatch key={this.key_for_tx(tx)} batch={tx.pixels} is_full_callback={() => false} gas_estimator={this.props.gas_estimator} />
              })
            }
          </div>
        </div>
      )
    else
      return null
  }
}

export default PendingTxList