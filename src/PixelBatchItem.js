import React, { PureComponent } from 'react'
import PixelSquare from './PixelSquare'
import PriceFormatter from './utils/PriceFormatter'
import { Form, FormGroup, FormControl, InputGroup } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import './PixelBatchItem.css'

class PixelBatchItem extends PureComponent {
  constructor(props) {
    super(props)
    if (props.on_price_change) {
      this.min_increase = 10
      this.max_increase = 100
      this.cent = new BigNumber(1).div(100)
      this.initial_price = props.pixel.price
      this.state = {
        price_increase: props.default_price_increase,
        price: this.end_price(props.default_price_increase)
      }
      this.on_account_change(props.account)
    }
    else
      this.state = {
        price: props.pixel.price
      }
    PriceFormatter.subscribe(this)
  }

  componentWillUpdate(next_props) {
    if (next_props.on_price_change)
      this.on_account_change(next_props.account)
  }

  on_account_change = new_acc => {
    if (this.owner_account(new_acc))
      this.change_price(new BigNumber(0))
    else
      this.change_price(this.end_price(this.state.price_increase))
  }

  handle_price_change = e => {
    e.preventDefault()
    let new_increase = Math.max(Math.min(e.target.value, this.max_increase), this.min_increase)
    let new_price = this.end_price(new_increase)
    this.setState({ price_increase: new_increase, price: new_price }, () => {
      this.change_price(new_price)
    })
  }

  end_price = increase => this.initial_price.mul(this.cent.mul(increase).add(1))

  change_price = price => {
    this.props.on_price_change(this.props.pixel, price) 
  }

  owner_account = acc => acc === this.props.pixel.owner

  price_info = () => {
    if (this.props.on_price_change)
      if (this.owner_account(this.props.account))
        return <span className='right-text'>owned</span>
      else
        return (
          <span className='right-text'>
            <Form inline className="cd-form">
              <FormGroup controlId="cd_form">
                {PriceFormatter.format_crypto_only(this.initial_price)} +{' '}
                <InputGroup className="price-selector">
                  <FormControl
                    bsSize='sm'
                    className="cd-input"
                    type="number"
                    min={this.min_increase}
                    max={this.max_increase}
                    placeholder={this.props.default_price_increase}
                    value={this.state.price_increase}
                    onChange={this.handle_price_change}
                  />
                  <InputGroup.Addon>
                    %
                  </InputGroup.Addon>
                </InputGroup>
                {' '} = {PriceFormatter.format_crypto_only(this.state.price)}
              </FormGroup>
            </Form>
          </span>
        )
    else 
      return (
        <span className='right-text'>
          {PriceFormatter.format(this.state.price)}
        </span>
      )
  }

  render() {
    return (
      <div className='batch-pixel-info'>
        <PixelSquare color={this.props.pixel.old_color} />
        <span className='text'>=></span>
        <PixelSquare color={this.props.pixel.color} />
        <span className='text'>({this.props.pixel.x}, {this.props.pixel.y}) {this.props.pixel.painted === false ? 'failed' : ''}</span>
        {this.price_info()}
      </div>
    )
  }
}

export default PixelBatchItem