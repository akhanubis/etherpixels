import React, { PureComponent } from 'react'
import { ProgressBar} from 'react-bootstrap'
import {TransitionMotion, spring } from 'react-motion'
import './LoadingPanel.css'

class LoadingPanel extends PureComponent {
  constructor(props) {
    super(props)
    let loading_phrases = [
      'Spending ether on pointless dapps fills you with determination...',
      'Knowing your portfolio might one day be worth millions... It fills you with determination.',
      'Hey Red, we are not gonna get away with this, are we?'
    ]
    this.state = {
      finished: false,
      phrase: loading_phrases[Math.floor(Math.random() * loading_phrases.length)]
    }
  }

  componentWillUpdate(next_props, next_state) {
    if (next_props.progress === 100 && this.props.progress !== 100)
      this.setState({finished: true})
  }

  on_start_style = () => {
    if (this.state.finished)
      return []
    return [{ data: this.props.progress, key: '1', style: { opacity: 1 } }]
  }

  /* end of exit anim */
  willLeave = () => {
    return {
      opacity: spring(0, {stiffness: 50, damping: 14})
    }
  }

  render() {
    return ([
      this.state.finished ? null : <div key="1" className="loading-background "></div>,
      <TransitionMotion key="2" defaultStyle={this.on_start_style()} willLeave={this.willLeave} styles={this.on_start_style()}>
        {interpolatedStyles => {
          if (interpolatedStyles[0])
            return (
              <div className="loading-bar-container" style={interpolatedStyles[0].style}>
                <div className="loading-bar-label">{this.state.phrase}</div>
                <div className="loading-bar">
                  <ProgressBar active now={interpolatedStyles[0].data} label={`${interpolatedStyles[0].data}%`} />
                </div>
              </div>
            )
          else
            return null
        }}
      </TransitionMotion>
    ])
  }
}

export default LoadingPanel