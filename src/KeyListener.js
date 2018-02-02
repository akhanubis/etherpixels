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

  key_down = e => {
    if (e.key === 'Alt') {
      e.preventDefault()
      this.props.on_alt_down()
    }
  }

  key_up = e => {
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