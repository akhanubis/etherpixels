import React, { PureComponent } from 'react'
import PixelBatchItem from './PixelBatchItem'
import { Button } from 'react-bootstrap'
import './PixelBatch.css'
import PriceFormatter from './utils/PriceFormatter'

class PixelBatch extends PureComponent {
  total_price = () => this.props.gas_estimator.estimate_total(this.props.batch)

  submit_buttons = () => {
    if (this.props.on_batch_submit)
      return (
        <div className="batch-button">
          <Button bsStyle="primary" onClick={this.props.on_batch_submit}>Batch paint</Button>
          <Button bsStyle="primary" onClick={this.props.on_batch_clear}>Clear</Button>
        </div>
      )
  }

  batch_list = () => {
    return this.props.batch.map(p => React.createElement(PixelBatchItem, { pixel: p, key: `${p.x}_${p.y}_${p.color}_${p.old_color}` }))
  }

  render() {
    if (this.props.batch.length) {
      return (
        <div className='batch-container'>
          {this.props.is_full_callback && this.props.is_full_callback() ? <p>Batch full</p> : null }
          <p>Batch (total including gas (@{PriceFormatter.format_to_unit(this.props.gas_estimator.gas_price(), 'gwei')}) and fees: {PriceFormatter.format(this.total_price())})</p>
          <div className='batch-inner-container'>
            {this.batch_list()}
          </div>
          {this.submit_buttons()}
        </div>
      )
    }
    else
      return null
  }
}

export default PixelBatch