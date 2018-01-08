// eslint-disable-next-line
import React, { Component } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import { SketchPicker } from 'react-color'
import {Helmet} from "react-helmet"
import { Col } from 'react-bootstrap';
import PixelData from './PixelData'
import CoordPicker from './CoordPicker'
import ColorUtils from './utils/ColorUtils'
import Canvas from './Canvas'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './truffle.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      viewport_size: {
        width: 800,
        height: 800
      },
      minimap_size: {
        width: 100,
        height: 100
      },
      zoom_size: {
        width: 100,
        height: 100
      },
      canvas_size: {},
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
    this.processed_logs = []
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

  load_canvases() {
    var img = new Image()
    this.last_cache_block = 0 //TODO
    img.src = '2049_2049.png'
    img.style.display = 'none'
    img.onload = () => {
      this.load_buffer_data(img)
      this.current_wheel_zoom = this.whole_canvas_on_viewport_ratio()
      this.point_at_center = { x: this.state.canvas_size.width * 0.5, y: this.state.canvas_size.height * 0.5 }
      this.redraw()
      this.start_watching()
      this.update_pixels([])
    }
  }

  load_buffer_data(img) {
    let canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    this.pixel_buffer_ctx = canvas.getContext('2d')
    this.pixel_buffer_ctx.drawImage(img, 0, 0)
  }

  redraw(e){
    let destination_top_left = this.destination_top_left()
    let destination_size = this.destination_size()
    this.main_canvas.clear()
    this.main_canvas.drawImage(this.pixel_buffer_ctx.canvas,
      0, 0,
      this.state.canvas_size.width, this.state.canvas_size.height,
      destination_top_left.x, destination_top_left.y,
      destination_size.x, destination_size.y)
    this.update_zoom(e)
  }
  
  whole_canvas_on_viewport_ratio() {
    return this.state.viewport_size.width / this.state.canvas_size.width
  }

  destination_top_left() {
    return {
      x: this.state.viewport_size.width * 0.5 - this.point_at_center.x * this.current_wheel_zoom,
      y: this.state.viewport_size.height * 0.5 - this.point_at_center.y * this.current_wheel_zoom
    }
  }

  destination_size() {
    /*
    wheel_zoom / result
    1    => 2049
    2    => 4098
    0.5  => -112
    0.39 => 0
    0.25 => 144
    */
    return {
      x: this.current_wheel_zoom * this.state.canvas_size.width,
      y: this.current_wheel_zoom * this.state.canvas_size.height
    }
  }
  
  new_log(log_index, tx_hash) {
    let log_id = `${tx_hash}-${log_index}`
    let new_log = !this.processed_logs.includes(log_id)
    if (new_log)
      this.processed_logs.push(log_id)
    return new_log
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
    pixel_sold_event.get(this.pixel_sold_handler.bind(this))
  }
  
  process_pixel_solds(log) {
    var new_pixels = log.reduce((pixel_data, l) => {
      if (this.new_log(l.logIndex, l.transactionHash))
        pixel_data.push(new PixelData(l.args))
      return pixel_data
    }, [])
    if (new_pixels.length)
      this.update_pixels(new_pixels)
  }
  
  update_pixels(new_pixels) {
    for(var i = 0; i < new_pixels.length; i++) {
      var new_pixel = new_pixels[i]
      this.pixel_buffer_ctx.putImageData(new_pixel.image_data, new_pixel.x, new_pixel.y)
    }
    this.redraw()
    this.update_minimap()
  }
  
  update_zoom(e) {
    if (!(e || this.current_zoom))
      return
    if (e)
      this.current_zoom = { x: e.layerX, y: e.layerY }
    this.zoom_canvas.drawImage(this.main_canvas.canvas,
                      Math.abs(this.current_zoom.x - 5),
                      Math.abs(this.current_zoom.y - 5),
                      10, 10,
                      0, 0,
                      this.state.zoom_size.width, this.state.zoom_size.height)
  }
  
  main_canvas_mouse_move(e) {
    if (!(e && this.point_at_center))
      return
    if (this.dragging_canvas)
    {
      this.drag_end = { x: e.clientX, y: e.clientY }
      this.point_at_center.x = this.point_at_center.x - (this.drag_end.x - this.drag_start.x) / this.current_wheel_zoom
      this.point_at_center.y = this.point_at_center.y - (this.drag_end.y - this.drag_start.y) / this.current_wheel_zoom
      this.drag_start = this.drag_end
    }
    this.redraw(e)
  }

  start_dragging(e) {
    e.preventDefault()
    this.dragging_canvas = true
    let x = e.clientX
    let y = e.clientY
    this.drag_start = { x: x, y: y }
  }

  stop_dragging(e) {
    e.preventDefault()
    this.dragging_canvas = false
    let x = e.clientX
    let y = e.clientY
    this.drag_end = { x: x, y: y }
  }

  update_minimap() {
    this.minimap_canvas.drawImage(this.pixel_buffer_ctx.canvas,
                      0, 0,
                      this.state.canvas_size.width, this.state.canvas_size.height,
                      0, 0,
                      this.state.minimap_size.width, this.state.minimap_size.height)
  }
  
  update_from_minimap(e) {
    this.point_at_center = {
      x: (e.layerX / this.state.minimap_size.width) * this.state.canvas_size.width,
      y: (e.layerY / this.state.minimap_size.height) * this.state.canvas_size.height
    }
    this.redraw()
  }

  hold_minimap(e) {
    if (e.button === 0)
      this.dragging_minimap = true
  }

  move_on_minimap(e) {
    if (this.dragging_minimap)
      this.update_from_minimap(e)
  }
  
  release_minimap(e) {
    e.preventDefault()
    this.dragging_minimap = false
    this.update_from_minimap(e)
  }

  wheel_zoom(e) {
    e.preventDefault()
    /* Check whether the wheel event is supported. */
    if (e.type == "wheel") this.wheel_even_supported = true
    else if (this.wheel_even_supported) return
    /* Determine the direction of the scroll (< 0 → up, > 0 → down). */
    var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1
    this.current_wheel_zoom = this.current_wheel_zoom * (delta > 0 ? 0.8 : 1.25)
    this.redraw()
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
        this.setState({ canvas_size: {
          width: contract_canvas_size[0].toNumber(),
          height: contract_canvas_size[1].toNumber(),
          z: contract_canvas_size[2].toNumber()
        }})
        this.load_canvases()
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
    
    //this.contract_instance.Paint(this.state.x, this.state.y, this.state.z, ColorUtils.rgbToBytes3(this.state.current_color), this.state.web3.fromAscii('pablo'), { from: this.account, value: "3000000000", gas: "2000000" })
    
    //this.contract_instance.BatchPaint(1, [this.state.x], [this.state.y], [this.state.z], [ColorUtils.rgbToBytes3(this.state.current_color)], [100000], this.state.web3.fromAscii('pablo'), { from: this.account, value: "3000000000", gas: "2000000" })
    
    var xx = parseInt(this.state.x)
    var yy = parseInt(this.state.y)
    var zz = parseInt(this.state.z)
    let x = [xx, xx + 1, xx + 2, xx + 3, xx + 4, xx + 5, xx + 6, xx + 7, xx + 8, xx + 9, xx + 10]
    let y = [yy, yy + 1, yy + 2, yy + 3, yy + 4, yy  + 5, yy + 6, yy + 7, yy + 8, yy + 9, yy + 10]
    let z = [zz, zz, zz, zz, zz, zz, zz, zz, zz, zz, zz]
    console.log(x)
    console.log(y)
    console.log(z)
    let color = [ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor())]
    let price = [100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000]
    this.contract_instance.BatchPaint(10, x, y, z, color, price, this.state.web3.fromAscii('pablo'), { from: this.account, value: "3000000000", gas: "3000000" })
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
              <div className='canvas-container' style={this.state.viewport_size}>
                <Canvas className='zoom-canvas' aliasing={false} width={this.state.zoom_size.width} height={this.state.zoom_size.height} ref={(c) => {this.zoom_canvas = c}} />
                <Canvas className='minimap-canvas' on_mouse_up={this.release_minimap.bind(this)} on_mouse_move={this.move_on_minimap.bind(this)} on_mouse_down={this.hold_minimap.bind(this)} aliasing={true} width={this.state.minimap_size.width} height={this.state.minimap_size.height} ref={(c) => {this.minimap_canvas = c}} />
                <Canvas className='canvas' on_mouse_wheel={this.wheel_zoom.bind(this)} on_mouse_down={this.start_dragging.bind(this)} on_mouse_up={this.stop_dragging.bind(this)} on_mouse_move={this.main_canvas_mouse_move.bind(this)} minimap_ref={this.minimap_canvas} zoom_ref={this.zoom_canvas} aliasing={false} width={this.state.viewport_size.width} height={this.state.viewport_size.height} ref={(c) => {this.main_canvas = c}} />
              </div>
            </Col>
          </div>
        </main>
      </div>
    )
  }
}

export default App
