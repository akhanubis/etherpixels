import React, { Component } from 'react'

class KeyListener extends Component {
  componentDidMount() {
    window.addEventListener('keydown', this.key_down.bind(this))
    window.addEventListener('keyup', this.key_up.bind(this))
  }

  key_down(e) {
    if (e.key === 'Alt') {
      e.preventDefault()
      this.props.on_alt_down()
    }
  }

  key_up(e) {
    if (e.key === 'Alt') {
      e.preventDefault()
      this.props.on_alt_up()
    }
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