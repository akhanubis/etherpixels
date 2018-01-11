// eslint-disable-next-line
import React, { Component } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import { SketchPicker } from 'react-color'
import {Helmet} from "react-helmet"
import { Col, Grid, Button, ButtonToolbar } from 'react-bootstrap';
import Pixel from './Pixel'
import CoordPicker from './CoordPicker'
import Footer from './Footer'
import ColorUtils from './utils/ColorUtils'
import ContractToWorld from './utils/ContractToWorld'
import WorldToCanvas from './utils/WorldToCanvas'
import CanvasUtils from './utils/CanvasUtils'
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
      batch_paint: []
    }
    this.processed_logs = []
    this.bootstrap_steps = 2
    this.bootstraped = 0
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

  try_bootstrap() {
    this.bootstraped++
    if (this.bootstraped < this.bootstrap_steps)
      return
    this.current_wheel_zoom = this.whole_canvas_on_viewport_ratio()
    this.point_at_center = { x: this.state.canvas_size.width * 0.5, y: this.state.canvas_size.height * 0.5 }
    this.resize_pixel_buffer(this.state.canvas_size, -1, this.state.max_index)
    this.start_watching()
    this.update_pixels([])
  }

  load_canvases() {
    this.load_cache_image()
    this.load_clear_image()
  }

  load_cache_image() {
    let img = new Image()
    this.last_cache_block = 0 //TODO
    img.src = '2049_2049.png'
    img.style.display = 'none'
    img.onload = () => {
      this.load_buffer_data(img)
      this.try_bootstrap()
    }
  }

  load_clear_image() {
    let clear_image = new Image()
    clear_image.src = 'clear_image.png'
    clear_image.style.display = 'none'
    clear_image.onload = () => {
      this.clear_image = clear_image
      this.try_bootstrap()
    }
  }

  load_buffer_data(img) {
    let canvas = document.createElement('canvas')
    canvas.width = this.state.canvas_size.width
    canvas.height = this.state.canvas_size.height
    this.pixel_buffer_ctx = canvas.getContext('2d')
    //this.pixel_buffer_ctx.drawImage(img, 0, 0)
  }

  redraw(e){
    let destination_top_left = this.destination_top_left()
    let destination_size = this.destination_size()
    this.main_canvas.clear(this.clear_image)
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
    pixel_sold_event.watch(this.pixel_sold_handler.bind(this))
    pixel_sold_event.get(this.pixel_sold_handler.bind(this))

    this.state.web3.eth.filter("latest").watch((error, block_hash) => {
      this.state.web3.eth.getBlock(block_hash, (error, result) => {
        if (error)
          console.error(error)
        else
          if (result.number > this.state.current_block)
            this.update_block_number(result.number)
      })
    })
  }
  
  process_pixel_solds(log) {
    var new_pixels = log.reduce((pixel_data, l) => {
      if (this.new_log(l.logIndex, l.transactionHash))
        pixel_data.push(Pixel.from_contract(l.args))
      return pixel_data
    }, [])
    if (new_pixels.length)
      this.update_pixels(new_pixels)
  }
  
  update_pixels(new_pixels) {
    for(var i = 0; i < new_pixels.length; i++) {
      let new_pixel = new_pixels[i]
      let canvas_coords = WorldToCanvas.to_canvas(new_pixel.x, new_pixel.y, this.state.canvas_size)
      this.pixel_buffer_ctx.putImageData(new_pixel.image_data, canvas_coords.x, canvas_coords.y)
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
    if (!this.point_at_center)
      return
    this.mouse_position = { x: e.layerX, y: e.layerY }
    if (this.dragging_canvas)
      this.drag(e)
    else
      this.update_zoom(e)
    this.update_hovering_pixel()
  }

  drag(e) {
    this.point_at_center.x = this.point_at_center.x - (this.mouse_position.x - this.drag_start.x) / this.current_wheel_zoom
    this.point_at_center.y = this.point_at_center.y - (this.mouse_position.y - this.drag_start.y) / this.current_wheel_zoom
    this.drag_start = this.mouse_position
    this.redraw(e)
  }

  update_hovering_pixel() {
    this.setState({ hovering_pixel: this.pixel_at_pointer() })
  }

  pixel_at_pointer() {
    let x = Math.round(this.point_at_center.x - this.state.canvas_size.width / 2 + (this.mouse_position.x - this.state.viewport_size.width * 0.5) / this.current_wheel_zoom)
    let y = - Math.round(this.point_at_center.y - this.state.canvas_size.height / 2 + (this.mouse_position.y - this.state.viewport_size.height * 0.5) / this.current_wheel_zoom)
    let canvas_coords = WorldToCanvas.to_canvas(x, y, this.state.canvas_size)
    let color_data = this.pixel_buffer_ctx.getImageData(canvas_coords.x, canvas_coords.y, 1, 1).data
    let color = { r: color_data[0], g: color_data[1], b: color_data[2], a: 255 }
    return new Pixel(
      x,
      y,
      0,
      ColorUtils.rgbToHex(color),
      null,
      Math.floor(Math.random() * 500)
    )
  }

  start_dragging(e) {
    e.preventDefault()
    this.dragging_canvas = true
    this.drag_start = { x: e.layerX, y: e.layerY }
  }

  main_canvas_mouse_up(e) {
    e.preventDefault()
    this.stop_dragging(e)
    this.pick_color(e)
    this.pick_coords(e)
  }

  stop_dragging(e) {
    this.dragging_canvas = false
    this.drag_end = { x: e.layerX, y: e.layerY }
  }

  pick_coords(e) {
    if (!e.ctrlKey)
      return
    let pap = this.pixel_at_pointer()
    this.setState({ x: pap.x, y: pap.y })
  }

  pick_color(e) {
    if (!e.shiftKey)
      return
    this.setState({ current_color: this.pixel_at_pointer().rgba_color() })
  }

  update_minimap() {
    this.minimap_canvas.clear()
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
    if (e.type === "wheel") this.wheel_even_supported = true
    else if (this.wheel_even_supported) return
    /* Determine the direction of the scroll (< 0 → up, > 0 → down). */
    var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1
    this.current_wheel_zoom = this.current_wheel_zoom * (delta > 0 ? 0.8 : 1.25)
    this.redraw()
  }

  update_block_number(block_number) {
    let old_max_index = this.state.max_index
    let new_max_index = block_number + 1 - this.state.genesis_block
    let new_size = new ContractToWorld(new_max_index).get_canvas_size()
    this.setState({ current_block: block_number, max_index: new_max_index })
    //if (new_size.width != this.state.canvas_size.width || new_size.height != this.state.canvas_size.height)
    this.resize_pixel_buffer(new_size, old_max_index, new_max_index)
  }

  resize_pixel_buffer(new_size, old_max_index, new_max_index) {
    let delta_w = 0.5 * (new_size.width - this.state.canvas_size.width)
    let delta_h = 0.5 * (new_size.height - this.state.canvas_size.height)
    this.setState({ canvas_size: new_size }, () => {
      let new_canvas = document.createElement('canvas')
      let new_context = new_canvas.getContext('2d')
      new_canvas.width = new_size.width
      new_canvas.height = new_size.height
      if (this.pixel_buffer_ctx) {
        CanvasUtils.clear(new_context, 'rgba(0,0,0,0)', new_size)
        let i_data = new ImageData(new Uint8ClampedArray([0, 0, 0, 127]), 1, 1)
        for (var i = old_max_index; i < new_max_index; i++) {
          let world_coods = new ContractToWorld(i + 1).get_coords()
          let canvas_coords = WorldToCanvas.to_canvas(world_coods.x, world_coods.y, new_size)
          new_context.putImageData(i_data, canvas_coords.x, canvas_coords.y)
        }
        new_context.drawImage(this.pixel_buffer_ctx.canvas, delta_w, delta_h)
        this.pixel_buffer_ctx = new_context
        this.point_at_center.x = this.point_at_center.x + delta_w
        this.point_at_center.y = this.point_at_center.y + delta_h
        this.redraw()
        this.update_minimap()
      }
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
    
    var canvasContract2 = contract(CanvasContract)
    canvasContract2.setProvider(this.state.infura.currentProvider)
    canvasContract2.deployed().then((instance) => {
      this.infura_contract_instance = instance
      
      instance.GenesisBlock.call().then(genesis_block => {
        let g_block = genesis_block.toNumber()
        this.state.infura.eth.getBlockNumber((error, b_number) => {
          if (error)
            console.error(error)
          else
            this.setState({ genesis_block: g_block }, () => {
              this.update_block_number(b_number)
              this.load_canvases()
            })
        })
      })
    })

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      canvasContract.deployed().then((instance) => {
        this.contract_instance = instance
        this.account = accounts[0]
      })
    })
  }

  pixel_to_paint() {
    return new Pixel(
      this.state.x,
      this.state.y,
      0,
      ColorUtils.rgbToHex(this.state.current_color),
      null,
      1000
      )
  }

  paint(e) {
    e.preventDefault()
    let pixel = this.pixel_to_paint()
    this.contract_instance.Paint(pixel.contract_index(), pixel.bytes3_color(), { from: this.account, value: pixel.price, gas: "200000" })
    
    //this.contract_instance.BatchPaint(1, [this.state.x], [this.state.y], [this.state.z], [ColorUtils.rgbToBytes3(this.state.current_color)], [100000], this.state.web3.fromAscii('pablo'), { from: this.account, value: "3000000000", gas: "2000000" })
    /*
    var xx = -1 
    var yy = -1
    let x = [xx, xx + 1, xx + 2, xx, xx + 1, xx + 2, xx, xx + 1, xx + 2]
    let y = [yy, yy, yy, yy + 1, yy + 1, yy + 1, yy + 2, yy + 2, yy + 2]
    var coords = []
    for(var a = 0; a < x.length; a++) {
      coords.push(new WorldToContract(x[a], y[a]).get_index())
    }
    let color = [ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor()), ColorUtils.rgbToBytes3(ColorUtils.randomColor())]
    let price = [200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000]
    this.contract_instance.BatchPaint(9, coords, color, price, { from: this.account, value: "3000000000", gas: "3000000" })
    */
  }

  batch_paint_full() {
    return this.state.batch_paint.length >= 10
  }

  batch_paint(e) {
    e.preventDefault()
    let batch_length = this.state.batch_paint.length
    let indexes = []
    let colors = []
    let prices = []
    let total_price = 0
    //TODO: chequear si hay que usar bignumber para price y total price
    this.state.batch_paint.forEach((pixel, i) => {
      indexes.push(pixel.contract_index())
      colors.push(pixel.bytes3_color())
      prices.push(pixel.price)
      total_price += pixel.price
    })
    this.contract_instance.BatchPaint(batch_length, indexes, colors, prices, { from: this.account, value: total_price, gas: "1500000" })
    this.setState({ batch_paint: []})
  }

  add_to_batch(e) {
    e.preventDefault()
    if (this.batch_paint_full())
      return
    this.setState((prev_state) => {
      return { batch_paint: prev_state.batch_paint.concat(this.pixel_to_paint()) }
    })
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
  
  new_x(e) { this.new_coordinate(e, { x: parseInt(e.target.value, 10) }) }
    
  new_y(e) { this.new_coordinate(e, { y: parseInt(e.target.value, 10) }) }

  max_dimension() {
    return 0.5 * (this.state.canvas_size.width - 1)
  }

  render() {
    let block_info = null
    let max_dimension = this.max_dimension()
    let min_dimension = -max_dimension
    if (this.state.current_block) {
      block_info = ([
        <p>Genesis block: {this.state.genesis_block}</p>,
        <p>Blocknumber: {this.state.current_block}</p>,
        <p>Max index: {this.state.max_index}</p>
      ])
    }
    else
      block_info = ''
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

        <main>
          <Grid fluid={true}>
            <div className="pure-g">
              <Col md={4}>
                <div className="pure-u-1-1">
                  <h1>Good to Go!</h1>
                  <p>Your Truffle Box is installed and ready.</p>
                  <SketchPicker
                    color={ this.state.current_color }
                    onChangeComplete={ this.handleColorChangeComplete.bind(this) }
                  />
                  <ButtonToolbar>
                    <Button bsStyle="primary" onClick={this.paint.bind(this)}>Paint</Button>
                    <Button bsStyle="primary" disabled={this.batch_paint_full()} onClick={this.add_to_batch.bind(this)}>Add to batch paint</Button>
                    <Button bsStyle="primary" disabled={!this.state.batch_paint.length} onClick={this.batch_paint.bind(this)}>Batch paint</Button>
                  </ButtonToolbar>
                  <p>Tip: you can pick a color from the canvas with Shift + click</p>
                  <p>Tip: you can pick a set of coordinates from the canvas with Ctrl + click</p>
                  <CoordPicker value={this.state.x} min={min_dimension} max={max_dimension} label='X' onChange={this.new_x.bind(this)} />
                  <CoordPicker value={this.state.y} min={min_dimension} max={max_dimension} label='Y' onChange={this.new_y.bind(this)} />
                  {block_info}
                </div>
              </Col>
              <Col md={8}>
                <div className='canvas-container' style={this.state.viewport_size}>
                  <Canvas className='zoom-canvas' aliasing={false} width={this.state.zoom_size.width} height={this.state.zoom_size.height} ref={(c) => {this.zoom_canvas = c}} />
                  <Canvas className='minimap-canvas' on_mouse_up={this.release_minimap.bind(this)} on_mouse_move={this.move_on_minimap.bind(this)} on_mouse_down={this.hold_minimap.bind(this)} aliasing={false} width={this.state.minimap_size.width} height={this.state.minimap_size.height} ref={(c) => {this.minimap_canvas = c}} />
                  <Canvas className='canvas' on_mouse_wheel={this.wheel_zoom.bind(this)} on_mouse_down={this.start_dragging.bind(this)} on_mouse_up={this.main_canvas_mouse_up.bind(this)} on_mouse_move={this.main_canvas_mouse_move.bind(this)} minimap_ref={this.minimap_canvas} zoom_ref={this.zoom_canvas} aliasing={false} width={this.state.viewport_size.width} height={this.state.viewport_size.height} ref={(c) => {this.main_canvas = c}} />
                </div>
              </Col>
            </div>
            <Footer pixel={this.state.hovering_pixel} />
          </Grid>
        </main>
      </div>
    )
  }
}

export default App
