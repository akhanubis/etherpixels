import React, { PureComponent } from 'react'
import PixelBatch from './PixelBatch'
import { FormGroup, Checkbox, PanelGroup } from 'react-bootstrap'
import {TransitionMotion, spring } from 'react-motion'
import './PendingTxList.css'

class PendingTxList extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      active_key: 'draft'
    }
  }

  expand_draft = () => this.handle_select('draft')

  handle_select = new_key => this.setState({ active_key: new_key })

  total_price = () => {
    let total_pixels = this.props.pending_txs.reduce((total, tx) => total.concat(tx.pixels), [])
    return this.props.gas_estimator.estimate_total(total_pixels)
  }

  custom_height = () => {
    return { height: `calc(100% - ${this.props.palette_height}px - 40px - 90px)` }
  }

  /* end of exit anim */
  willLeave = () => {
    return {
      opacity: spring(0, {stiffness: 66, damping: 14})
    }
  }

  /* start of enter anim */
  willEnter = () => {
    return {
      left: -100,
      opacity: 1
    }
  }

  on_start_style = () => {
    return this.props.pending_txs.map(tx => ({ data: tx, key: tx.key, style: { opacity: 0 } }))
  }

  /* end of enter anim */
  active_style = () => this.props.pending_txs.map(tx => ({ data: tx, key: tx.key, style: { opacity: 1, left: spring(0, {stiffness: 130, damping: 14}) } }))

  tx_element = (key, tx) => {
    return React.createElement(PixelBatch, { current_panel: this.state.active_key /* trigger a render so collapsing works*/, panel_key: key.toString(), title: `Tx #${key}`, batch: tx.pixels, gas_estimator: this.props.gas_estimator })
  }

  interpolated_to_css = style => ({ opacity: style.opacity, marginLeft: style.left + '%' })

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
            {interpolatedStyles => (
              <div>
                {interpolatedStyles.reverse().map(config => (
                  <div key={config.key} className="tx-panel-container" style={this.interpolated_to_css(config.style)}>
                    {this.tx_element(config.key, config.data)}
                  </div>
                ))}
              </div>
            )}
          </TransitionMotion>
        </PanelGroup>
      </div>
    )
  }
}

export default PendingTxList