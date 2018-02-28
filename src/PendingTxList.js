import React, { PureComponent } from 'react'
import PixelBatch from './PixelBatch'
import {TransitionMotion, spring } from 'react-motion'
import './PendingTxList.css'

class PendingTxList extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      active_key: 'draft'
    }
  }

  expand_draft = () => this.on_toggle('draft', true)

  on_toggle = (toggled_key, expand) => {
    this.setState({ active_key: expand ? toggled_key : null })
  }

  custom_height = () => {
    return { height: `calc(100% - ${this.props.palette_height}px - 40px - 90px - 20px)` }
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
    return this.props.pending_txs.map(tx => ({ data: tx, key: tx.hash, style: { opacity: 0 } }))
  }

  /* end of enter anim */
  active_style = () => this.props.pending_txs.map(tx => ({ data: tx, key: tx.hash, style: { opacity: 1, left: spring(0, {stiffness: 130, damping: 14}) } }))

  tx_element = tx => {
    let title = `Tx ${tx.hash.substr(0, 7)}...`
    let badges = [{ css: 'pending', label: 'PENDING'}, { css: 'link', label: 'LINK', link: true}]
    return React.createElement(PixelBatch, { on_toggle: this.on_toggle, expanded: this.state.active_key === tx.hash, panel_key: tx.hash, title: title, badges: badges, batch: tx.pixels, preview: tx.preview, on_preview_change: this.props.on_preview_change, explorer_link: true })
  }

  draft_element = () => {
    return React.cloneElement(this.props.children, { on_toggle: this.on_toggle, expanded: this.state.active_key === 'draft' })
  }

  interpolated_to_css = style => ({ opacity: style.opacity, marginLeft: style.left + '%' })

  render() {
    return ([
      <div className='pending-txs-title' key={'1'}>
        Batch
      </div>,
      <div className='pending-txs-container' style={this.custom_height()} key={'2'}>
        <div className="draft-panel-container">
          {this.draft_element()}
        </div>
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
                  {this.tx_element(config.data)}
                </div>
              ))}
            </div>
          )}
        </TransitionMotion>
      </div>
    ])
  }
}

export default PendingTxList