import React, { PureComponent } from 'react'
import { Navbar, Nav, NavItem, Tooltip, OverlayTrigger } from 'react-bootstrap'
import Tips from './Tips'
import './Footer.css'

class Footer extends PureComponent {
  tooltip = label => <Tooltip id={label.replace(' ', '')}>{label}</Tooltip>

  render() {
    return (
      <Navbar fixedBottom>
        <Nav pullLeft>
          <Tips />
        </Nav>
        <Nav className="footer-icons" pullRight>
          <OverlayTrigger placement="top" overlay={this.tooltip('About')}>
            <NavItem>
              <i className="fas fa-info"></i>
            </NavItem>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={this.tooltip('Contract code')}>
            <NavItem>
              <i className="fas fa-code"></i>
            </NavItem>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={this.tooltip('Reddit')}>
            <NavItem>
              <i className="fab fa-reddit-alien"></i>
            </NavItem>
          </OverlayTrigger>
        </Nav>
      </Navbar>
    )
  }
}

export default Footer