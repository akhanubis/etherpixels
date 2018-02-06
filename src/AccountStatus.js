import React, { PureComponent } from 'react'
import BlockiesIdenticon from './BlockiesIdenticon'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'
import './AccountStatus.css'



class AccountStatus extends PureComponent {
  error_tooltip = (
    <Tooltip id="tooltip">
      No active account detected. It looks like metamask is locked or missing
    </Tooltip>
  )

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
          <div>
            <BlockiesIdenticon account={this.props.account} />
          </div>
        </OverlayTrigger>
      )
    else
      return (
        <OverlayTrigger placement='left' overlay={this.error_tooltip}>
          <span className='glyphicon glyphicon-exclamation-sign icon-2x'></span>
        </OverlayTrigger>
      )
  }
}

export default AccountStatus