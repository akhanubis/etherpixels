// eslint-disable-next-line
import React, { Component } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import { SketchPicker } from 'react-color'
import {Helmet} from "react-helmet"
import { Col } from 'react-bootstrap';
import PixelData from './PixelData'
import CoordPicker from './CoordPicker'
import Timer from './Timer'
import ColorUtils from './utils/ColorUtils'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './truffle.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pixel_buffer: null,
      canvas_size: {
        x: 5000,
        y: 5000
      },
      image_size: {},
      web3: null,
      //min: 0,
      //max: 0,
      min: -20,
      max: 30,
      thresholds: [],
      genesis_block: null,
      current_block: null,
      current_color: { r: 255, g: 255, b: 255, a: 255 },
      x: 0,
      y: 0,
      z: 0
    }
    this.processed_txs = []
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3,
        infura: results.infura
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  fetch_pixel_buffer() {
    var img = new Image()
    this.last_cache_block = 0 //TODO
    img.src = '4097_4097.png'
    var canvas = this.canvas
    this.canvas_context = canvas.getContext('2d')
    this.canvas_context.imageSmoothingEnabled = false
    this.canvas_context.mozImageSmoothingEnabled = false
    this.canvas_context.webkitImageSmoothingEnabled = false
    this.canvas_context.msImageSmoothingEnabled = false
    this.zoom_canvas_context = this.zoom_canvas.getContext('2d')
    this.zoom_canvas_context.imageSmoothingEnabled = false
    this.zoom_canvas_context.mozImageSmoothingEnabled = false
    this.zoom_canvas_context.webkitImageSmoothingEnabled = false
    this.zoom_canvas_context.msImageSmoothingEnabled = false
    this.canvas.addEventListener('mousemove', this.update_zoom.bind(this))
    this.canvas_context.fillStyle = 'gray'
    this.canvas_context.fillRect(0, 0, this.state.canvas_size.x, this.state.canvas_size.y)
    
    img.onload = () => {
      var image_top = this.image_top_position()
      this.canvas_context.drawImage(img, image_top.x, image_top.y)
      img.style.display = 'none'
      var buffer = this.canvas_context.getImageData(image_top.x, image_top.y, this.state.image_size.x, this.state.image_size.y).data
      this.setState({ pixel_buffer: buffer })
      this.start_watching()
    }
  }
  
  image_top_position() {
    return {
      x: Math.floor((this.state.canvas_size.x - this.state.image_size.x) / 2),
      y: Math.floor((this.state.canvas_size.y - this.state.image_size.y) / 2)
    }
  }
  
  new_tx(tx_hash) {
    var new_tx = !this.processed_txs.includes(tx_hash)
    if (new_tx)
      this.processed_txs.push(tx_hash)
    return new_tx
  }
  
  pixel_sold_handler(error, result) {
    if (error)
      console.error(error)
    else
      if (result.transactionHash) // event, not log
        result = [result]
      this.process_pixel_solds(result)
  }
  
  start_watching() {
    var pixel_sold_event = this.infura_contract_instance.PixelSold(null, { fromBlock: this.last_cache_block, toBlock: 'latest' })
    pixel_sold_event.watch(this.pixel_sold_handler.bind(this))
    pixel_sold_event.get(this.pixel_sold_handler.bind(this))
  }
  
  process_pixel_solds(log) {
    var new_pixels = log.reduce((pixel_data, l) => {
      if (this.new_tx(l.transactionHash))
        pixel_data.push(new PixelData(l.args))
      return pixel_data
    }, [])
    if (new_pixels.length)
      this.update_buffer(new_pixels)
  }
  
  update_buffer(new_pixels) {
    for(var i = 0; i < new_pixels.length; i++) {
      var new_pixel = new_pixels[i]
      var img_top = this.image_top_position()
      this.canvas_context.putImageData(new_pixel.image_data, img_top.x + new_pixel.x, img_top.y + new_pixel.y)
    }
    this.update_zoom()
  }
  
  update_zoom(e) {
    if (!(e || this.state.current_zoom))
      return
    if (e)
      this.setState({ current_zoom: { x: e.layerX, y: e.layerY } })
    this.zoom_canvas_context.drawImage(this.canvas,
                      Math.abs(this.state.current_zoom.x - 5),
                      Math.abs(this.state.current_zoom.y - 5),
                      10, 10,
                      0, 0,
                      200, 200)
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
    
    var canvasContract2 = contract(CanvasContract)
    canvasContract2.setProvider(this.state.infura.currentProvider)
    canvasContract2.deployed().then((instance) => {
      this.infura_contract_instance = instance
      
      instance.CurrentBoundaries().watch((error, result) => {
        if (error)
          console.error(error)
        else
          this.setState({ min: result.args['current_min'].toNumber(), max: result.args['current_max'].toNumber() })	
      })
        
      instance.CanvasSize.call().then(contract_canvas_size => {
        this.setState({ image_size: {
          x: contract_canvas_size[0].toNumber(),
          y: contract_canvas_size[1].toNumber(),
          z: contract_canvas_size[2].toNumber()
        }})
        this.fetch_pixel_buffer()
      })
    })

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      canvasContract.deployed().then((instance) => {
        this.contract_instance = instance
        this.account = accounts[0]
        
        
          
        /*
        
		
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
        */
        
        
        
       
        //this.state.web3.eth.estimateGas({from: accounts[0], to: contractInstance.address, amount: this.state.web3.toWei(1, "ether")}, (result) => { console.log(result)}) TODO VER ESTIMACION DE PAINT Y DEMAS
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
    this.contract_instance.Paint(this.state.x, this.state.y, this.state.z, ColorUtils.rgbToBytes3(this.state.current_color), this.state.web3.fromAscii('pablo'), { from: this.account, value: "3000000000", gas: "2000000" })
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
          <script src='ZeroClientProvider.js' type='text/javascript'></script>
          <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css"></link>
        </Helmet>
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container-fluid">
          <Timer ref={(e) => { this.colorTimer = e }} />
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
              <div className='canvas-container-container'>
                <canvas className='zoom-canvas' width={200} height={200} ref={(c) => {this.zoom_canvas = c}}></canvas>
                <div className='canvas-container'>
                  <canvas className='canvas' width={this.state.canvas_size.x} height={this.state.canvas_size.y} ref={(c) => {this.canvas = c}}></canvas>  
                </div>
              </div>
            </Col>
          </div>
        </main>
      </div>
    )
  }
}

export default App
