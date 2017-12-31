import React, { Component } from 'react'
import Konva from 'konva'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import { Stage, Layer, Rect, Text } from "react-konva";

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class ColoredRect extends React.Component {
  constructor(props) {
    super(props)
    this.pixel_size = 40
    this.state = {
      color_index: 0,
      colors: [Konva.Util.getRandomColor(), Konva.Util.getRandomColor(), Konva.Util.getRandomColor(), Konva.Util.getRandomColor(), Konva.Util.getRandomColor(), Konva.Util.getRandomColor(), Konva.Util.getRandomColor()],
      x: props.pixel.x,
      y: props.pixel.y,
      x_offset: props.canvas_size_x / 2,
      y_offset: props.canvas_size_y / 2,
    }
  }
  
  handleClick = () => {
    this.setState((prev_state) => {
      return { color_index: (prev_state.color_index + 1) % prev_state.colors.length }
    })
  }
  
  current_color() {
    return this.state.colors[this.state.color_index]
  }
  
  render() {
    return (
      <Rect
        x={this.state.x_offset + this.pixel_size * this.state.x}
        y={this.state.y_offset + this.pixel_size * this.state.y}
        width={this.pixel_size}
        height={this.pixel_size}
        fill={this.current_color()}
        shadowBlur={5}
        onClick={this.handleClick}
      />
    )
  }
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pixels: [
        { x: 0, y: 0 },
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: 0 },
        { x: -1, y: 1 },
        { x: -1, y: -1 }
      ],
      web3: null,
      contract_instance: null,
      account: null,
      min: 0,
      max: 0,
      thresholds: [],
      genesis_block: null,
      current_block: null
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const canvasContract = contract(CanvasContract)
    canvasContract.setProvider(this.state.web3.currentProvider)

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      canvasContract.deployed().then((instance) => {
        instance.CurrentBoundaries().watch((error, result) => {
          if (error)
            console.error(error)
          else
            this.setState({ min: result.args['current_min'].toNumber(), max: result.args['current_max'].toNumber() })	
        })
		
        instance.ThresholdsData.call().then(thresholds_data => {
          var t_length = thresholds_data[0].length
          var ts = []
          for(var i = 0; i < t_length; i++)
            ts.push( { threshold: thresholds_data[0][i].toNumber(), blocks_per_retarget: thresholds_data[1][i].toNumber() })
          this.setState({
            genesis_block: thresholds_data[2].toNumber(),
            thresholds_length: t_length,
            thresholds: ts
          })
        })
        
        //this.state.web3.eth.estimateGas({from: accounts[0], to: contractInstance.address, amount: this.state.web3.toWei(1, "ether")}, (result) => { console.log(result)}) TODO VER ESTIMACION DE PAINT Y DEMAS
		
        this.setState({ contract_instance: instance, account: accounts[0] })
      })
      
      this.state.web3.eth.filter("latest").watch((error, block_hash) => {
        this.state.web3.eth.getBlock(block_hash, (error, result) => {
          if (error)
            console.error(error)
          else
            this.setState({ current_block: result.number })  
        })
      })
    })
  }
  
  prox_retarget(c_instance) {
	var current_block_since_genesis = this.state.current_block - this.state.genesis_block
	var current_threshold = this.state.thresholds.findIndex(e => e.threshold > current_block_since_genesis)
	if (current_threshold === -1)
	  return 'inf'
	else {
	  var prev_threshold = current_threshold ? this.state.thresholds[current_threshold - 1] : 0
	  var blocks_per_retarget = this.state.thresholds[current_threshold].blocks_per_retarget
	  return blocks_per_retarget - ((current_block_since_genesis - prev_threshold) % blocks_per_retarget)
    }
  }
  
  paint(e) {
	  e.preventDefault()
	  this.state.contract_instance.Paint("0", "0", ['0xffffff', '0xff0000', '0x00ff00', '0x0000ff', '0x000000', '0x0f0f0f', '0xf0f0f0'], this.state.web3.fromAscii('pablo'), { from: this.state.account, value: "3000000000", gas: "2000000" })
  }
  thresholds_fetched() {
	return this.state.thresholds.length
  }

  render() {
    let retarget_info = null
    if (this.thresholds_fetched()) {
      retarget_info = ([
        <p>Genesis block: {this.state.genesis_block}</p>,
        <p>Blocknumber: {this.state.current_block}</p>,
        <p>Prox retarget en X bloques: {this.prox_retarget(this.state.contractInstance)}</p>
      ])
    }
    else
      retarget_info = ''
    
    let rects = this.state.pixels.map((p) => {
      return <ColoredRect pixel={p} canvas_size_x={window.innerWidth} canvas_size_y={window.innerHeight}/>
    })
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Good to Go!</h1>
              <p>Your Truffle Box is installed and ready.</p>
              <button onClick={this.paint.bind(this)}>
                Paint
              </button>
              <h2>Smart Contract Example</h2>
              <p>El minimo es: {this.state.min}</p>
              <p>El maximo es: {this.state.max}</p>
              {retarget_info}
            </div>
            <Stage width={window.innerWidth} height={window.innerHeight}>
              <Layer>
                {rects}
              </Layer>
            </Stage>
          </div>
        </main>
      </div>
    )
  }
}

export default App
