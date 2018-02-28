import React, { PureComponent } from 'react'
import { Carousel } from 'react-bootstrap'
import './Tips.css'

class Tips extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      current_tip: Math.floor(Math.random() * this.tips.length)
    }
  }

  tips = [
    "Tip: Its cheaper to paint pixels in bulk",
    "Tip: It costs less gas to paint pixels already painted by someone else",
    "Tip: You only have to pay for gas usage when changing the colors to pixels you already own",
    "Tip: You can move around the canvas by holding the mouse wheel or pressing the arrow keys",
    "Tip: You can zoom in and out by scrolling the mouse wheel",
    "Tip: You can control how prices in ether and USD are displayed in the settings panel",
    "Tip: You can see the shortcut key for each tool by hovering over it",
    "The canvas growth slows down over time",
    "After ~3 days have passed since contract deployment, the canvas size will be 257x257px",
    "After ~2 weeks have passed since contract deployment, the canvas size will be 513x513px",
    "After ~4 months have passed since contract deployment, the canvas size will be 1281x1281px",
    "The canvas final size will be 2049x2049px",
  ]

  componentDidMount = () => this.interval = setInterval(this.next_tip, 60000)

  componentWillUnmount = () => clearInterval(this.interval)

  next_tip = e => {
    if (e)
      e.preventDefault()
    this.setState(prev_state => ({ current_tip: (prev_state.current_tip + 1) % this.tips.length }))
  }

  render() {
    return (
      <Carousel
        indicators={false}
        controls={false}
        activeIndex={this.state.current_tip}
        direction="next"
        onClick={this.next_tip}
      >
        {this.tips.map((t, i) => {
          return (
            <Carousel.Item key={i}>
              <p>{t}</p>
            </Carousel.Item>
          )
        })}
      </Carousel>
    )
  }
}

export default Tips