import React, { Component } from 'react'

class AccountStatus extends Component {
  render() {
    if (this.props.account)
      return <div>Using account {this.props.account}</div>
    else
      return <div>No active account detected. It looks like metamask is locked or missing</div>
  }
}

export default AccountStatus