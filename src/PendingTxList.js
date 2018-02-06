import React, { PureComponent } from 'react'
import PixelBatch from './PixelBatch'
import { FormGroup, Checkbox, PanelGroup } from 'react-bootstrap'
import {TransitionMotion, spring, presets } from 'react-motion'
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
    return this.weak_map_for_keys.get(tx) + '' /* JS */
  }

  txs_list = () => {
    return this.props.pending_txs.map(tx => {
      let key = this.key_for_tx(tx)
      
    }).reverse()
  }

  custom_height = () => {
    return { height: `calc(100% - ${this.props.palette_height}px - 40px - 90px)`}
  }

  willLeave = () => {
    return {
      opacity: spring(0, {stiffness: 66, damping: 14})
    }
  }

  willEnter = () => {
    return {
      opacity: 0
    }
  }

  on_start_style = () => {
    return this.props.pending_txs.map(tx => ({ data: tx, key: this.key_for_tx(tx), style: { opacity: 0} }))
  }

  active_style = () => this.props.pending_txs.map(tx => ({ data: tx, key: this.key_for_tx(tx), style: { opacity: spring(1, {stiffness: 66, damping: 14}) } }))

  tx_element = (key, tx) => {
    return React.createElement(PixelBatch, { current_panel: this.state.active_key /* trigger a render so collapsing works*/, panel_key: key.toString(), title: `Tx #${key}`, batch: tx.pixels, gas_estimator: this.props.gas_estimator })
  }

  render() {
    return (
      <div className='pending-txs-container' style={this.custom_height()}>
        <FormGroup>
          <Checkbox inline checked={this.props.preview} onChange={this.props.on_preview_change}> Show preview </Checkbox>
        </FormGroup>
        <PanelGroup accordion id="pending_txs" activeKey={this.state.active_key} onSelect={this.handle_select}>
          {React.cloneElement(this.props.children, { current_panel: this.state.active_key })}
          <TransitionMotion
            defaultStyle={this.on_start_style()}
            willLeave={this.willLeave}
            willEnter={this.willEnter}
            styles={this.active_style()}
          >
            {interpolatedStyles =>
              <div>
                {interpolatedStyles.reverse().map(config => (
                  <div key={config.key} style={config.style}>
                    {this.tx_element(config.key, config.data)}
                  </div>
                ))}
              </div>
            }
          </TransitionMotion>
        </PanelGroup>
      </div>
    )
  }
}

export default PendingTxList