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
        <div className="about-panel-inner">
          <h2 className="about-panel-title">About Etherpixels</h2>
          <p>
            Built by <a href="https://github.com/akhanubis" target="_blank">akhanubis</a>
          </p>
          <p>
            Styled by <a href="https://www.behance.net/violetazulado" target="_blank">violetazulado</a>
          </p>
          <p>
            Reach us at <a href="mailto:team@etherpixels.co">team@etherpixels.co</a>
          </p>
          <p>
            Built using
          </p>
          <div className="built-using">
            <div>
              <div className="built-using-icon">
                <i className="fab fa-node-js"/>
              </div>
              <div className="built-using-name">nodejs</div>
            </div>
            <div>
              <div className="built-using-icon">
                <i className="fab fa-react"/>
              </div>
              <div className="built-using-name">React</div>
            </div>
          </div>
          <p>
            Powered by
          </p>
          <div className="built-using">
            <div>
              <div className="built-using-icon">
                <i className="fab fa-ethereum"/>
              </div>
              <div className="built-using-name">Ethereum</div>
            </div>
          </div>
          <p>
            Current version: 0.1.0
          </p>
          <img src="assets/builtfirebase.png" width="250px" className="firebase-image"/>
        </div>
      </div>
    )
  }
}

export default About