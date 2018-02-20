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
    "Tip: 1 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "Tip: 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "Tip: 3 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "Tip: 4 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    "Tip: 5 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
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