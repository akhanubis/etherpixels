import { PureComponent } from 'react'

class KeyListener extends PureComponent {
  componentDidMount() {
    window.addEventListener('keydown', this.key_down)
    window.addEventListener('keyup', this.key_up)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.key_down)
    window.removeEventListener('keyup', this.key_up)
  }

  update_key = (e, state) => {
    if (!e.target.classList.value.includes('form-control'))
      this.props.on_key_update({ [e.key]: state })
  }

  key_down = e => {
    this.update_key(e, true)
  }

  key_up = e => {
    this.update_key(e, false)
  }

  render() {
    return null
  }
}

export default KeyListener