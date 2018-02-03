import React, { Component } from 'react'

class KeyListener extends Component {
  componentDidMount() {
    window.addEventListener('keydown', this.key_down)
    window.addEventListener('keyup', this.key_up)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.key_down)
    window.removeEventListener('keyup', this.key_up)
  }

  update_key = (e, state) => {
    e.preventDefault()
    this.props.on_key_update({ [e.key]: state })
  }

  key_down = e => {
    this.update_key(e, true)
  }

  key_up = e => {
    this.update_key(e, false)
  }

  render() {
    return (
      <div className='key-wrapper'>
        {this.props.children}
      </div>
    )
  }
}

export default KeyListener