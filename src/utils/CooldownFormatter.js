import EnvironmentManager from './EnvironmentManager'

class CooldownFormatter {
  static init() {
    this.confirmations_needed = EnvironmentManager.get('REACT_APP_CONFIRMATIONS_NEEDED')
  }

  static new_block(b_number) {
    this.current_block = b_number
  }

  static format(locked_until) {
    let eab = this.earliest_available_block(locked_until)
    if (eab <= this.current_block)
      return 'available now'
    else {
      let diff = eab - this.current_block
      return `available in ${diff} block${ diff === 1 ? '' : 's' }(~${diff * 15} seconds)`
    }
  }

  static short_format(locked_until) {
    let eab = this.earliest_available_block(locked_until)
    if (eab <= this.current_block)
      return null
    else
      return eab - this.current_block
  }

  static earliest_available_block(locked_until) {
    return locked_until - this.confirmations_needed - 1
  }
}

export default CooldownFormatter