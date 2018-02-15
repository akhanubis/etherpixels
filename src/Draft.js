import React, { PureComponent } from 'react'
import PixelBatch from './PixelBatch'
import PriceFormatter from './utils/PriceFormatter'
import { Button } from 'react-bootstrap' 
import BigNumber from 'bignumber.js'
import Alert from 'react-s-alert'

class Draft extends PureComponent {
  constructor(props) {
    super(props)
    this.max_length = 20
    this.update_callback = () => this.props.on_update(this.state.preview, this.state.pixels)
    this.gas_value = 0
    this.state = {
      gas: new BigNumber(0),
      pixels: [],
      indexes: [],
      colors: [],
      cooldown: 0,
      preview: true,
      gas_query_id: 0,
      calculating_gas: false
    }
  }

  componentWillUpdate(next_props, next_state) {
    this.gas_value = new BigNumber(next_props.gas_price).mul(next_state.gas)

    if (!this.state.cooldown && next_props.default_cooldown)
      this.setState({ cooldown: next_props.default_cooldown })

    let length = next_state.pixels.length
    if (length && length !== this.state.pixels.length) {
      clearTimeout(this.gas_query_timer)
      let gas_query_id = next_state.gas_query_id + 1
      let indexes = []
      let colors = next_state.pixels.map(p => {
        indexes.push(p.contract_index())
        return p.bytes3_color()
      })
      /* to avoid sending too many estimateGas calls */
      this.setState({
        pixels: next_state.pixels,
        indexes: indexes,
        colors: colors,
        calculating_gas: true,
        gas_query_id: gas_query_id
      })
      this.gas_query_timer = setTimeout(() => {
        this.props.contract_instance.BatchPaint.estimateGas(this.state.pixels.length, this.state.indexes, this.state.colors, { from: this.props.account, value: 10000000000000000 })
        .then(this.gas_query(gas_query_id))
      }, 1000)
    }
  }

  gas_query = query_id => {
    return (gas => {
      if (query_id === this.state.gas_query_id)
        this.setState({ gas: Math.floor(gas * 1.1 + 10000), calculating_gas: false })
    })
  }

  title = () => {
    let length = this.state.pixels.length
    return `Draft (${length} pixel${length > 1 ? 's' : ''}${length >= this.max_length ? ', max reached' : ''})`
  }

  paint = e => {
    e.preventDefault()
    if (this.props.account) {
      let length = this.state.pixels.length
      let tx_payload = length === 1 ? this.paint_one(this.state.pixels[0]) : this.paint_many(length)
      this.props.on_send(tx_payload, this.state.pixels, this.clear)
    }
    else
      Alert.error('No ethereum account detected, unlock Metamask or use Mist browser', {
        position: 'top',
        effect: null,
        offset: 54
      })
  }

  paint_many = length => {
    return this.props.contract_instance.BatchPaint.request(length, this.state.indexes, this.state.colors, this.paint_options(length))
  }

  paint_one = pixel => {
    return this.props.contract_instance.Paint.request(pixel.contract_index(), pixel.bytes3_color(), this.paint_options(1))
  }

  paint_options = length => {
    return { from: this.props.account, value: this.props.cooldown_params.wei_per_cooldown.mul(this.state.cooldown).mul(length), gas: this.state.gas, gasPrice: this.props.gas_price }
  }

  full = existing_pixel_index => {
    if (!this.state.pixels.length)
      return false
    return existing_pixel_index === -1 && this.state.pixels.length >= this.max_length
  }

  update_with_callback = new_state => this.setState(new_state, this.update_callback)


  add = pixel_to_paint => {
    let existing_pixel_index = this.state.pixels.findIndex(p => p.same_coords(pixel_to_paint))
    if (this.full(existing_pixel_index))
      return
    if (existing_pixel_index === -1)
      existing_pixel_index = this.state.pixels.length
    else if (this.state.pixels[existing_pixel_index].color === pixel_to_paint.color)
      return
    this.update_with_callback(prev_state => {
      const temp = [...prev_state.pixels]
      temp[existing_pixel_index] = pixel_to_paint
      return { pixels: temp }
    })
  }

  remove = pixel_at_pointer => {
    this.update_with_callback(prev_state => {
      return { pixels: prev_state.pixels.filter(p => !p.same_coords(pixel_at_pointer)) }
    })
  }

  clear = e => {
    if (e)
      e.preventDefault()
    this.update_with_callback({ pixels: [], cooldown: this.props.default_cooldown })
  }

  toggle_preview = () => {
    let new_state = !this.state.preview
    this.update_with_callback({ preview: new_state })
  }

  price_info = () => {
    return <p>Estimated gas value: {this.state.calculating_gas ? 'calculating...' : PriceFormatter.format_to_unit(this.gas_value, 'gwei')}</p>
  }

  render() {
    return (
      <PixelBatch
        title={this.title()}
        panel_key={'draft'}
        estimating_gas={this.state.calculating_gas}
        gas={this.state.gas}
        gas_price={this.props.gas_price}
        batch={this.state.pixels}
        preview={this.state.preview}
        on_preview_change={this.toggle_preview}
        on_toggle={this.props.on_toggle}
        expanded={this.props.expanded}
      >
        {this.price_info()}
        <div className="batch-button">
          <Button bsStyle="primary" onClick={this.paint} disabled={this.state.calculating_gas}>Paint</Button>
          <Button bsStyle="primary" onClick={this.clear}>Clear</Button>
        </div>
      </PixelBatch>
    )
  }
}

export default Draft