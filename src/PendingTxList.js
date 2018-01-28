import React, { Component } from 'react'
import PixelBatch from './PixelBatch'
import PriceFormatter from './utils/PriceFormatter'
import './PendingTxList.css'

class PendingTxList extends Component {
  total_price() {
    let total_pixels = this.props.pending_txs.reduce((total, tx) => {
      return total + tx.pixels.length
    }, 0)
    return total_pixels * this.props.paint_fee
  }

  render() {
    if (this.props.pending_txs.length)
      return (
        <div className='pending-txs-container'>
          <p>Pending txs (total without gas: {PriceFormatter.format(this.total_price())})</p>
          <div className='pending-txs-inner-container'>
            {
              this.props.pending_txs.map((tx, i) => {
                return <PixelBatch key={i} batch={tx.pixels} is_full_callback={() => false} paint_fee={this.props.paint_fee} />
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