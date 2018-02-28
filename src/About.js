import React, { PureComponent } from 'react'
import './About.css'

class About extends PureComponent {
  expand = () => this.props.current_panel === 'about'

  style = () => {
    let right = this.expand() ? 0 : - this.props.panel_width
    return { right: right, width: this.props.panel_width }
  }

  render() {
    return (
      <div className="right-panel about-panel" style={this.style()}>
        hoalaaa
      </div>
    )
  }
}

export default About