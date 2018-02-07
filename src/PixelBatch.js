import React, { PureComponent } from 'react'
import PixelBatchItem from './PixelBatchItem'
import { Button, Panel, Grid, Col } from 'react-bootstrap'
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

  handle_toggle = (expand) => {
    this.props.on_toggle(this.props.panel_key, expand)
  }

  render() {
    let batch_length = this.props.batch.length
    if (batch_length) {
      let price_info = this.props.gas_estimator ? (<p>Batch (total including gas (@{PriceFormatter.format_to_unit(this.props.gas_estimator.gas_price(), 'gwei')}) and fees: {PriceFormatter.format(this.total_price())})</p>) : null
      let link = this.props.link ? (<a target="_blank" href={`https://etherscan.io/tx/${this.props.panel_key}`}>link</a>) : null
      return (
        <Panel id={this.props.panel_key} expanded={this.props.expanded} onToggle={this.handle_toggle}>
          <Panel.Heading>
            <Panel.Title>
              <Grid fluid>
                <Col md={9}>
                  {this.props.title} ({batch_length} pixel{batch_length > 1 ? 's' : ''}{this.props.max_batch_size && batch_length >= this.props.max_batch_size ? ', max reached' : ''})
                </Col>
                <Col md={3}>
                  {link}
                  <Panel.Toggle>
                    arrow
                  </Panel.Toggle>
                </Col>
              </Grid>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <div className='batch-container'>
              {price_info}
              <div className='batch-inner-container'>
                {this.batch_list()}
              </div>
              {this.submit_buttons()}
            </div>
          </Panel.Body>
        </Panel>
      )
    }
    else
      return null
  }
}

export default PixelBatch