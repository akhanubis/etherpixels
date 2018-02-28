import React, { PureComponent } from 'react'
import { Navbar, Nav, NavItem, Tooltip, OverlayTrigger } from 'react-bootstrap'
import Tips from './Tips'
import './Footer.css'

class Footer extends PureComponent {
  tooltip = label => <Tooltip id={label.replace(' ', '')}>{label}</Tooltip>

  contract_link = () => this.props.contract_instance ? `https://${ this.props.network_id === '1' ? '' : 'ropsten.' }etherscan.io/address/${ this.props.contract_instance.address }#code` : '#'

  render() {
    return (
      <Navbar fixedBottom>
        <Nav pullLeft>
          <Tips />
        </Nav>
        <Nav className="footer-icons" pullRight>
          <OverlayTrigger placement="top" overlay={this.tooltip('Download canvas')}>
            <NavItem href={this.props.pixels_url}>
              <i className="fas fa-download"></i>
            </NavItem>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={this.tooltip('About')}>
            <NavItem onClick={this.props.on_about_click} active={this.props.current_panel === 'about'}>
              <i className="fas fa-info"></i>
            </NavItem>
          </OverlayTrigger>
          <OverlayTrigger placement="top" overlay={this.tooltip('Contract code')}>
            <NavItem href={this.contract_link()} target="_blank">
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