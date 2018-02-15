import BigNumber from 'bignumber.js'
import Numeral from 'numeral'
import axios from 'axios'

class PriceFormatter {
  static init(unit, humanized_units) {
    BigNumber.config({ EXPONENTIAL_AT: [-20, 20] })
    this.set_unit(unit)
    this.set_humanized(humanized_units)
    this.unit_exps = {
      ether:  new BigNumber(10).pow(-18),
      finney:  new BigNumber(10).pow(-15),
      szabo:  new BigNumber(10).pow(-12),
      gwei: new BigNumber(10).pow(-9),
      shannon: new BigNumber(10).pow(-9),
      mwei: new BigNumber(10).pow(-6),
      kwei: new BigNumber(10).pow(-3),
      wei: new BigNumber(10).pow(0)
    }
    this.unit_labels = {
      ether:  'ETH',
      finney:  'Finney',
      szabo:  'Szabo',
      gwei: 'Gwei',
      shannon: 'Shannon',
      mwei: 'Mwei',
      kwei: 'Kwei',
      wei: 'wei'
    }
    this.usd_price = new BigNumber(0)
    setInterval(this.fetch_usd_price.bind(this), 150000)
    this.fetch_usd_price()
  }

  static fetch_usd_price() {
    axios.get('https://api.coinmarketcap.com/v1/ticker/ethereum/').then(response => {
      this.usd_price = new BigNumber(response.data[0].price_usd)
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

  static set_unit(new_unit) {
    this.unit = new_unit
  }

  static set_humanized(humanized) {
    this.humanized = !!humanized
  }

  static format_usd_price(wei_value) {
    return wei_value.mul(this.ether_exp()).mul(this.usd_price)
  }

  static format(wei_value) {
    return this.format_to_unit(wei_value, this.unit)
  }

  static format_to_unit(wei_value, unit) {
    wei_value = new BigNumber(wei_value)
    return `${ Numeral(wei_value.mul(this.unit_exp(unit))).format('0a') } ${ this.unit_label(unit) } ($${ this.format_usd_price(wei_value).toFixed(2) })`
  }
}

export default PriceFormatter