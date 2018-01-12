import React, { Component } from 'react'
import PixelSquare from './PixelSquare'
import { Button } from 'react-bootstrap'
import './PixelBatch.css'

class PixelBatch extends Component {
  total_price() {
    return this.props.batch.reduce((total, p) => {
      return total + p.price
    }, 0)
  }

  remove_batch(i, e) {
    e.preventDefault()
    this.props.on_batch_remove(i)
  }

  render() {
    if (this.props.batch.length)
      return (
        <div className='batch-container'>
          <p>Batch (total: {this.total_price()})</p>
          <div className='batch-inner-container'>
            {
              this.props.batch.map((p, i) => {
                return (
                  <div className='batch-pixel-info' key={i}>
                    <PixelSquare color={p.old_color} />
                    <span className='text'>=></span>
                    <PixelSquare color={p.color} />
                    <span className='text'>({p.x}, {p.y}) for {p.price}</span>
                    <div className='batch-delete' onClick={this.remove_batch.bind(this, i)}>
                      remove
                    </div>
                  </div>
                )
              })
            }
          </div>
          <Button className="batch-button" bsStyle="primary" onClick={this.props.on_batch_submit}>Batch paint</Button>
        </div>
      )
    else
      return null
  }
}

export default PixelBatch