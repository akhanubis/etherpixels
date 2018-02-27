import React, { PureComponent } from 'react'
import './ComingSoon.css'

class ComingSoon extends PureComponent {
  render() {
    return (
      <div className="coming-soon-container">
        <h1>Coming soon...</h1>
        <p>In the meantime, you can play around with the beta version of the app by switching Metamask to the Ropsten network</p>
        <img src="assets/metamask_ropsten.png"/>
        <p>Need a Ropsten faucet? Try <a href="https://faucet.metamask.io/" target="_blank">https://faucet.metamask.io/</a></p>
      </div>
    )
  }
}

export default ComingSoon