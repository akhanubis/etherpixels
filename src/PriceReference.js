import React, { PureComponent } from 'react'
import CssHide from './CssHide'
import PriceFormatter from './utils/PriceFormatter'
import ColorUtils from './utils/ColorUtils'
import { Grid, Col } from 'react-bootstrap'
import './PriceReference.css'

class PriceReference extends PureComponent {
  constructor(props) {
    super(props)
    PriceFormatter.subscribe(this)
  }
  
  static_content =  () =>  {
    return (
      <div>
        <div className='price-view-reference-gradient'/>
        <div className='price-view-reference-labels'>
          <Grid fluid={true}>
            {[0, 0.5, 1].map((step, i) => <Col md={4} key={step} className={`label-${i}`}>{PriceFormatter.format(step * ColorUtils.priceColorMaxPrice)}</Col>)}
          </Grid>
        </div>
      </div>
    )
  }

  render() {
    let { show, fullscreen } = this.props
    return (
      <CssHide hide={!show}>
        <div className={`price-view-reference ${fullscreen ? 'fullscreen' : ''}`}>
          {this.static_content()}
        </div>
      </CssHide>
    )
  }
}

export default PriceReference