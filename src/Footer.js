import React, { PureComponent } from 'react'
import { Navbar } from 'react-bootstrap'
import Tips from './Tips'
import './Footer.css'

class Footer extends PureComponent {
  render() {
    return (
      <Navbar fixedBottom>
        <Navbar.Text>
          <Tips />
        </Navbar.Text>
      </Navbar>
    )
  }
}

export default Footer