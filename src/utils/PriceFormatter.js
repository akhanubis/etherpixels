import BigNumber from 'bignumber.js'
import axios from 'axios'

class PriceFormatter {
  static init() {
    BigNumber.config({ EXPONENTIAL_AT: [-20, 20] })
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

  static current_unit_exp() {
    return this.unit_exps[this.unit]
  }

  static ether_exp() {
    return this.unit_exps['ether']
  }

  static current_unit_label() {
    return this.unit_labels[this.unit]
  }

  static set_unit(new_unit) {
    this.unit = new_unit
  }

  static format_usd_price(wei_value) {
    return wei_value.mul(this.ether_exp()).mul(this.usd_price)
  }

  static format(wei_value) {
    wei_value = new BigNumber(wei_value)
    return `${ wei_value.mul(this.current_unit_exp()).toString() } ${ this.current_unit_label() } ($${ this.format_usd_price(wei_value).toFixed(2) })`
  }
}

export default PriceFormatter