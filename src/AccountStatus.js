import React, { PureComponent } from 'react'
import BlockiesIdenticon from './BlockiesIdenticon'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import './AccountStatus.css'



class AccountStatus extends PureComponent {
  account_tooltip = () => {
    return (
      <Tooltip id="tooltip">
        Using {this.props.account.substr(0, 7)}...{this.props.account.substr(37, 5)}
      </Tooltip> 
    )
  }

  render() {
    if (this.props.account)
      return (
        <OverlayTrigger placement='left' overlay={this.account_tooltip()}>
          <div className="account-detected">
            <BlockiesIdenticon account={this.props.account} />
          </div>
        </OverlayTrigger>
      )
    else
      return (
        <div className="account-not-detected">
          <i className="fas fa-exclamation"></i>
        </div>
      )
  }
}

export default AccountStatus