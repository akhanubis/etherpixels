import React, { PureComponent } from 'react'
import { toDataUrl } from './utils/blockies/blockies'

class BlockiesIdenticon extends PureComponent {
  render() {
    return <img src={toDataUrl(this.props.account)} style={{width: 32, height: 32}} />
  }
}

module.exports = BlockiesIdenticon