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
      let new_price = this.initial_price.mul(this.cent.mul(props.default_price_increase).add(1))
      props.pixel.price = new_price
      this.state = {
        price_increase: props.default_price_increase
      }
      this.props.on_price_change({ ...props.pixel, price: new_price })
    }
  }

  change_price = e => {
    e.preventDefault()
    let new_increase = Math.max(Math.min(e.target.value, this.max_increase), this.min_increase)
    this.setState({ price_increase: new_increase })
    this.props.on_price_change({ ...this.props.pixel, price: this.initial_price.mul(this.cent.mul(new_increase).add(1)) })
  }

  price_info = () => {
    if (this.props.on_price_change)
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
                  onChange={this.change_price}
                />
                <InputGroup.Addon>
                  %
                </InputGroup.Addon>
              </InputGroup>
              {' '} = {PriceFormatter.format_crypto_only(this.props.pixel.price)}
            </FormGroup>
          </Form>
        </span>
      )
    else  
      return (
        <span className='right-text'>
          {PriceFormatter.format(this.props.pixel.price)}
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