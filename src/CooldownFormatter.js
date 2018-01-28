import { Component } from 'react'

class CooldownFormatter extends Component {
  format(locked_until) {
    if (locked_until <= this.props.current_block)
      return 'available now'
    else {
      let diff = locked_until - this.props.current_block
      return `available in ${diff} block${ diff === 1 ? '' : 's' }(~${diff * 15} seconds)`
    }
  }

  render() {
    return null
  }
}

export default CooldownFormatter