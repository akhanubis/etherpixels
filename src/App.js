import React, { Component } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import { SketchPicker } from 'react-color'
import {Helmet} from "react-helmet"
import { Col } from 'react-bootstrap';
import PixelData from './PixelData'
import CoordPicker from './CoordPicker'
import CanvasContainer from './CanvasContainer'
import ColorUtils from './utils/ColorUtils'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pixels: [],
      web3: null,
      contract_instance: null,
      account: null,
      //min: 0,
      //max: 0,
      min: -20,
      max: 30,
      thresholds: [],
      genesis_block: null,
      current_block: null,
      current_color: { r: 255, g: 255, b: 255, a: 255 },
      x: 0,
      y: 0
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
        
        instance.PixelPainted().watch((error, result) => {
          if (error)
            console.error(error)
          else {
            var new_pixel = new PixelData(result.args.x.toNumber(), result.args.y.toNumber(), result.args.new_color, result.args.new_signature, result.args.new_owner)
            this.setState(prev_state => {
              const new_pixels = [...prev_state.pixels]
              var existing_index = prev_state.pixels.findIndex(p => { return p.x === new_pixel.x && p.y === new_pixel.y }) //TODO: crear indice bidimensional que referencie al index en el array unidim
              if (existing_index === -1)
                new_pixels.push(new_pixel)
              else
                new_pixels[existing_index] = new_pixel
              return { pixels: new_pixels }
            })
          }
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
        
        //TODO: sacar y hacer esta logica en el evento de boundaries
        this.setState(prev_state => {
          const new_pixels = [...prev_state.pixels]
          for(var x = this.state.min; x <= this.state.max; x++) {
            for(var y = this.state.min; y <= this.state.max; y++) {
              var new_pixel = new PixelData(x, y, null, '', '')
              var existing_index = prev_state.pixels.findIndex(p => { return p.x === new_pixel.x && p.y === new_pixel.y }) //TODO: crear indice bidimensional que referencie al index en el array unidim
              if (existing_index === -1)
                new_pixels.push(new_pixel)
            }
          }
          return { pixels: new_pixels }
        })
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
    this.state.contract_instance.Paint(this.state.x, this.state.y, ColorUtils.rgbArrayToBytes32([this.state.current_color]), this.state.web3.fromAscii('pablo'), { from: this.state.account, value: "3000000000", gas: "2000000" })
  }
  
  thresholds_fetched() {
    return this.state.thresholds.length
  }
  
  handleColorChangeComplete(new_color) {
    this.setState({ current_color: new_color.rgb })
  }
  
  new_coordinate(e, new_coord) {
    e.preventDefault()
    this.setState(new_coord)
  }
  
  new_x(e) { this.new_coordinate(e, { x: e.target.value }) }
    
  new_y(e) { this.new_coordinate(e, { y: e.target.value }) }
    
  
  
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
    
    return (
      <div className="App">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Pavlito clabo un clabito</title>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css"></link>
        </Helmet>
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container-fluid">
          <div className="pure-g">
            <Col md={4}>
              <div className="pure-u-1-1">
                <h1>Good to Go!</h1>
                <p>Your Truffle Box is installed and ready.</p>
                <SketchPicker
                  color={ this.state.current_color }
                  onChangeComplete={ this.handleColorChangeComplete.bind(this) }
                />
                <button onClick={this.paint.bind(this)}>
                  Paint
                </button>
                <CoordPicker value={this.state.x} min={this.state.min} max={this.state.max} label='X' onChange={this.new_x.bind(this)} />
                <CoordPicker value={this.state.y} min={this.state.min} max={this.state.max} label='Y' onChange={this.new_y.bind(this)} />
                <h2>Smart Contract Example</h2>
                <p>El minimo es: {this.state.min}</p>
                <p>El maximo es: {this.state.max}</p>
                {retarget_info}
              </div>
            </Col>
            <Col md={8}>
              <CanvasContainer pixels={this.state.pixels} />
            </Col>
          </div>
        </main>
      </div>
    )
  }
}

export default App
