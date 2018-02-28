import React, { PureComponent } from 'react'
import './ComingSoon.css'

class ComingSoon extends PureComponent {
  render() {
    return (
      <div className="coming-soon-container">
        <h1>Coming soon...</h1>
        <p>In the meantime, you can play around with the beta version of the app by switching Metamask to the Ropsten network</p>
        <img src="assets/metamask_ropsten.png" alt="metamask-ropsten"/>
        <p>Need a Ropsten faucet? Try <a href="https://faucet.metamask.io" target="_blank">faucet.metamask.io</a></p>
        <p>Don't have Metamask? You can still get real time updates of the canvas at <a href="https://ropsten.etherpixels.co">ropsten.etherpixels.co</a></p>
      </div>
    )
  }
}

export default ComingSoon