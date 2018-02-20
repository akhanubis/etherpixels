import React, { PureComponent } from 'react'
import AccountStatus from './AccountStatus'
import { Navbar, Nav, NavItem } from 'react-bootstrap'
import './Topbar.css'

class Topbar extends PureComponent {
  render() {
    return (
      <Navbar fixedTop>
        <Navbar.Header>
          <Navbar.Brand>
            ETHPaint
          </Navbar.Brand>
        </Navbar.Header>
        <Nav pullRight>
          <NavItem className='account-name'>
            {this.props.name}
          </NavItem>
          <NavItem className='account-status'>
            <AccountStatus account={this.props.account} />
          </NavItem>
          <NavItem className="settings-icon" onClick={this.props.toggle_settings}>
            <i className="fas fa-cog" />
          </NavItem>
        </Nav>
      </Navbar>
    )
  }
}

export default Topbar