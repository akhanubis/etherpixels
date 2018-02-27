import React, { PureComponent } from 'react'
import './ComingSoon.css'

class ComingSoon extends PureComponent {
  render() {
    return (
      <div className="coming-soon-container">
        <h1>Coming soon...</h1>
        <p>In the meantime, you can play around with the Ropsten version of the app by switching Metamask to the Ropsten network</p>
        <img src="assets/metamask_ropsten.png"/>
      </div>
    )
  }
}

export default ComingSoon