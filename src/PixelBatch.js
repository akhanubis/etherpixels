import React, { PureComponent } from 'react'
import PixelBatchItem from './PixelBatchItem'
import { Panel, Grid, Badge } from 'react-bootstrap'
import './PixelBatch.css'
import EnvironmentManager from './utils/EnvironmentManager'

class PixelBatch extends PureComponent {
  constructor(props) {
    super(props)
    if (props.explorer_link) {
      let network = EnvironmentManager.get_network()
      this.explorer_link = `https://${network === 'ropsten' ? 'ropsten.' : ''}etherscan.io/tx/${props.panel_key}`
    }
    this.render_badges(props)
    this.render_preview_icon(props)
  }

  componentWillUpdate(next_props) {
    if (this.props.badges.length !== next_props.badges.length)
      this.render_badges(next_props)
    if (this.props.preview !== next_props.preview)
      this.render_preview_icon(next_props)
  }

  batch_list = () => {
    return this.props.batch.map(p => React.createElement(PixelBatchItem, { pixel: p, account: this.props.account, on_price_change: this.props.on_price_change, default_price_increase: this.props.default_price_increase, key: `${p.x}_${p.y}` }))
  }

  handle_toggle = (expand) => {
    this.props.on_toggle(this.props.panel_key, expand)
  }

  toggle_preview = e => {
    e.preventDefault()
    this.props.on_preview_change(this.props.panel_key)
  }

  render_badges = props => {
    this.badges = (props.badges || []).map(b => {
      let b_html = <Badge key={b.label} className={b.css}>{b.label}</Badge>
      if (b.link)
        return <a key={b.label} target="_blank" href={this.explorer_link}>{b_html}</a>
      else
        return <span key={b.label}>{b_html}</span>
    })
  }

  render_preview_icon = props => {
    if (this.props.on_preview_change)
      this.preview_icon = (
        <div className="batch-preview-icon">
          <a href="#" onClick={this.toggle_preview}>
            <div style={props.preview ? {} : { display: 'none'}}>
              <i className="fas fa-eye"/>
            </div>
            <div style={props.preview ? { display: 'none'} : {}}>
              <i className="fas fa-eye-slash"/>
            </div>
          </a>
        </div>
      )
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
                <div className="batch-title">
                  {this.props.title}
                  {this.badges}
                </div>
                <div className="batch-title-buttons">
                  <Panel.Toggle>
                    <i className="fas fa-caret-down"/>
                  </Panel.Toggle>
                </div>
              </Grid>
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body collapsible>
            <div className='batch-container'>
              <div className='batch-inner-container'>
                {this.batch_list()}
              </div>
              {this.props.children}
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