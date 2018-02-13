import React, { PureComponent } from 'react'
import PixelBatchItem from './PixelBatchItem'
import { Button, Panel, Grid, Col } from 'react-bootstrap'
import './PixelBatch.css'
import PriceFormatter from './utils/PriceFormatter'
import BigNumber from 'bignumber.js'
import EnvironmentManager from './utils/EnvironmentManager'

class PixelBatch extends PureComponent {
  constructor(props) {
    super(props)
    if (props.explorer_link) {
      let network = EnvironmentManager.get_network()
      this.explorer_link = <a target="_blank" href={`https://${network === 'ropsten' ? 'ropsten.' : ''}etherscan.io/tx/${props.panel_key}`}>link</a>
    }
    this.render_preview_icon(props)
  }

  componentWillUpdate(next_props) {
    this.render_preview_icon(next_props)
  }

  gas_value = () => new BigNumber(this.props.gas_price).mul(this.props.gas)

  submit_buttons = () => {
    if (this.props.on_draft_submit)
      return (
        <div className="batch-button">
          <Button bsStyle="primary" onClick={this.props.on_draft_submit}>Paint</Button>
          <Button bsStyle="primary" onClick={this.props.on_draft_clear}>Clear</Button>
        </div>
      )
  }

  batch_list = () => {
    return this.props.batch.map(p => React.createElement(PixelBatchItem, { pixel: p, key: `${p.x}_${p.y}_${p.color}_${p.old_color}` }))
  }

  price_info = () => {
    if (this.props.estimating_gas)
      return <p>Estimated gas value: calculating...</p>
    else if (this.props.gas)
      return <p>Estimated gas value: {PriceFormatter.format_to_unit(this.gas_value(), 'gwei')}</p>
    else
      return null
  }

  handle_toggle = (expand) => {
    this.props.on_toggle(this.props.panel_key, expand)
  }

  toggle_preview = e => {
    e.preventDefault()
    this.props.on_preview_change(this.props.panel_key)
  }

  can_preview = () => this.props.on_preview_change

  render_preview_icon = props => {
    if (this.can_preview())
      this.preview_icon = <Col md={3}><a href="#" onClick={this.toggle_preview}>{props.preview ? 'hide' : 'show'}</a></Col>
    else
      this.preview_icon = null
  }

  render() {
    let batch_length = this.props.batch.length
    if (batch_length) {
      return (
        <Panel id={this.props.panel_key} expanded={this.props.expanded} onToggle={this.handle_toggle}>
          <Panel.Heading>
            <Panel.Title>
              <Grid fluid>
                {this.preview_icon}
                <Col md={this.can_preview() ? 6 : 9}>
                  {this.props.title} ({batch_length} pixel{batch_length > 1 ? 's' : ''}{this.props.max_draft_size && batch_length >= this.props.max_draft_size ? ', max reached' : ''})
                </Col>
                <Col md={3}>
                  {this.explorer_link}
                  <Panel.Toggle>
                    arrow
                  </Panel.Toggle>
                </Col>
              </Grid>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <div className='batch-container'>
              {this.price_info()}
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