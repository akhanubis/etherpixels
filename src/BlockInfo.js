import React, { PureComponent } from 'react'
import LastUpdatedTimer from './LastUpdatedTimer'
import { Grid, Col } from 'react-bootstrap'
import './BlockInfo.css'

class BlockInfo extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      last_updated: new Date()
    }
  }

  componentWillReceiveProps(new_props) {
    if (new_props.current !== this.props.current)
      this.setState({ last_updated: new Date() })
  }

  render() {
    return (
      <Grid fluid={true} className="block-info">
        <Col md={4}>
          <div>Latest block #</div>
          <div>{this.props.current}</div>
        </Col>
        <Col md={4}>
          <div>Pixel supply</div>
          <div>{(this.props.max_index || 0) + 1}</div>
        </Col>
        <Col md={4}>
          <div>Last updated</div>
          <div><LastUpdatedTimer last_updated={this.state.last_updated} /></div>
        </Col>
      </Grid>
    )
  }
}

export default BlockInfo