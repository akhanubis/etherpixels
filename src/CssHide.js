import React, { PureComponent } from 'react'
import './CssHide.css'

class CssHide extends PureComponent {
  render() {
    return (
      <div className={this.props.hide ? 'css-hide-hidden' : 'css-hide-shown'}>
        {this.props.children}
      </div>
    )
  }
}

export default CssHide