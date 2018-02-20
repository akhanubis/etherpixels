import React, { PureComponent } from 'react'
import { Navbar, Nav, NavItem, Tooltip, OverlayTrigger } from 'react-bootstrap'
import Tips from './Tips'
import './Footer.css'

class Footer extends PureComponent {

  code_tooltip = (
    <Tooltip id="code_tooltip">
      Contract code
    </Tooltip>
  )

  render() {
    return (
      <Navbar fixedBottom>
        <Navbar.Text pullLeft>
          <Tips />
        </Navbar.Text>
        <Nav className="footer-icons" pullRight>
          <NavItem>
            <i className="fas fa-info"></i>
          </NavItem>
          <OverlayTrigger placement="top" overlay={this.code_tooltip}>
            <NavItem>
              <i className="fas fa-code"></i>
            </NavItem>
          </OverlayTrigger>
          <NavItem>
            <i className="fab fa-reddit-alien"></i>
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default Footer