import BigNumber from 'bignumber.js'
import Numeral from 'numeral'
import axios from 'axios'

class PriceFormatter {
  static init(options) {
    BigNumber.config({ EXPONENTIAL_AT: [-20, 20] })
    this.subscribers = []
    this.state_nullifier = 0
    this.set_options(options)
    this.unit_exps = {
      ether:   new BigNumber(10).pow(-18),
      finney:  new BigNumber(10).pow(-15),
      szabo:   new BigNumber(10).pow(-12),
      gwei:    new BigNumber(10).pow(-9),
      shannon: new BigNumber(10).pow(-9),
      mwei:    new BigNumber(10).pow(-6),
      kwei:    new BigNumber(10).pow(-3),
      wei:     new BigNumber(10).pow(0)
    }
    this.unit_labels = {
      ether:   'ETH',
      finney:  'Finney',
      szabo:   'Szabo',
      gwei:    'Gwei',
      shannon: 'Shannon',
      mwei:    'Mwei',
      kwei:    'Kwei',
      wei:     'wei'
    }
    this.usd_price = new BigNumber(0)
    setInterval(this.fetch_usd_price.bind(this), 150000)
    this.fetch_usd_price()
  }

  static subscribe(react_component) {
    this.subscribers.push(react_component)
  }

  static fetch_usd_price() {
    axios.get('https://api.coinmarketcap.com/v1/ticker/ethereum/').then(response => {
      this.usd_price = new BigNumber(response.data[0].price_usd)
      if (this.with_usd)
        this.set_options({})
    })
  }

  static unit_exp(unit) {
    return this.unit_exps[unit]
  }

  static ether_exp() {
    return this.unit_exps['ether']
  }

  static unit_label(unit) {
    return this.unit_labels[unit]
  }

  static set_options(new_options) {
    Object.entries(new_options).forEach(([k, v]) => this[k] = v)
    this.state_nullifier++
    this.subscribers.forEach(s => s.setState({ price_state: this.state_nullifier}))
  }

  static _format(wei_value, unit, with_usd) {
    wei_value = new BigNumber(wei_value)
    let eth_value = this.humanized_units ? Numeral(wei_value.mul(this.unit_exp(unit))).format('0.0a') : wei_value.mul(this.unit_exp(unit)).toString()
    return `${ eth_value } ${ this.unit_label(unit) }${ with_usd ? ` ($${ this.format_usd_price(wei_value).toFixed(2) })` : ''}`
  }

  static format_usd_price(wei_value) {
    return wei_value.mul(this.ether_exp()).mul(this.usd_price)
  }

  static format(wei_value) {
    return this._format(wei_value, this.unit, this.with_usd)
  }

  static format_to_unit(wei_value, unit) {
    return this._format(wei_value, unit, this.with_usd)
  }

  static format_crypto_only(wei_value) {
    return this._format(wei_value, this.unit, false)
  }
}

export default PriceFormatter