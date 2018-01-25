import React, { Component } from 'react'
import PixelBatch from './PixelBatch'
import BigNumber from 'bignumber.js'
import PriceFormatter from './utils/PriceFormatter'
import './PendingTxList.css'

class PendingTxList extends Component {
  total_price() {
    let total = this.props.pending_txs.reduce((total, tx) => {
      return total.add(tx.pixels.reduce((tx_total, p) => {
        return tx_total.add(p.price)
      }, new BigNumber(0)))
    }, new BigNumber(0))
    return total.toNumber()
  }

  render() {
    if (this.props.pending_txs.length)
      return (
        <div className='pending-txs-container'>
          <p>Pending txs (total: {PriceFormatter.format(this.total_price())})</p>
          <div className='pending-txs-inner-container'>
            {
              this.props.pending_txs.map((tx, i) => {
                return <PixelBatch key={i} batch={tx.pixels} is_full_callback={() => false} />
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