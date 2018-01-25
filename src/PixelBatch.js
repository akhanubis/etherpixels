import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import { Button } from 'react-bootstrap'
import './PixelBatch.css'
import BigNumber from 'bignumber.js'
import PriceFormatter from './utils/PriceFormatter'

class PixelBatch extends Component {
  total_price() {
    let total = this.props.batch.reduce((total, p) => {
      return total.add(p.price)
    }, new BigNumber(0))
    return total.toNumber()
  }

  remove_batch(i, e) {
    e.preventDefault()
    this.props.on_batch_remove(i)
  }

  render() {
    if (this.props.batch.length) {
      let submit_buttons = null
      if (this.props.on_batch_submit)
        submit_buttons = <div className="batch-button">
                           <Button bsStyle="primary" onClick={this.props.on_batch_submit}>Batch paint</Button>
                           <Button bsStyle="primary" onClick={this.props.on_batch_clear}>Clear</Button>
                        </div>
      return (
        <div className='batch-container'>
          {this.props.is_full_callback() ? <p>Batch full</p> : null }
          <p>Batch (total: {PriceFormatter.format(this.total_price())})</p>
          <div className='batch-inner-container'>
            {
              this.props.batch.map((p, i) => {
                return (
                  <div className='batch-pixel-info' key={i}>
                    <PixelSquare color={p.old_color} />
                    <span className='text'>=></span>
                    <PixelSquare color={p.color} />
                    <span className='text'>({p.x}, {p.y}) for {PriceFormatter.format(p.price)}</span>
                    {this.props.on_batch_remove ?
                      <div className='batch-delete' onClick={this.remove_batch.bind(this, i)}>
                        remove
                      </div>
                      : null
                    }
                  </div>
                )
              })
            }
          </div>
          {submit_buttons}
        </div>
      )
    }
    else
      return null
  }
}

export default PixelBatch