// eslint-disable-next-line
import React, { Component } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import {Helmet} from "react-helmet"
import { Col, Grid, Navbar, Nav, NavItem } from 'react-bootstrap'
import Pixel from './Pixel'
import HoverInfo from './HoverInfo'
import ColorUtils from './utils/ColorUtils'
import ContractToWorld from './utils/ContractToWorld'
import WorldToCanvas from './utils/WorldToCanvas'
import WorldToContract from './utils/WorldToContract'
import CanvasUtils from './utils/CanvasUtils'
import Canvas from './Canvas'
import PixelBatch from './PixelBatch'
import PixelPaintedEvent from './PixelPaintedEvent'
import KeyListener from './KeyListener'
import axios from 'axios'
import AddressBuffer from './AddressBuffer'
import Pusher from 'pusher-js'
import PendingTxList from './PendingTxList'
import PriceFormatter from './utils/PriceFormatter'
import CooldownFormatter from './CooldownFormatter'
import GasEstimator from './GasEstimator'
import LogUtils from './utils/LogUtils'
import AccountStatus from './AccountStatus'
import EventLogPanel from './EventLogPanel'
import Palette from './Palette'
import ToolSelector from './ToolSelector'
import LastUpdatedTimer from './LastUpdatedTimer'
import BigNumber from 'bignumber.js'
const contract = require('truffle-contract')
import { ElementQueries, ResizeSensor } from 'css-element-queries'

import './css/bootstrap.min.css'
import './App.css'

import LogRocket from 'logrocket'
LogRocket.init(process.env.REACT_APP_LOGROCKET_APP_ID)

class App extends Component {
  constructor(props) {
    super(props)

    let stored_settings = localStorage.getItem('settings')
    this.default_settings = {
      unit: 'gwei',
      gas_price: new BigNumber(1000000000) /* 1 gwei */,
      preview_pending_txs: true,
      custom_colors: [],
      shortcuts: {
        paint: 'a',
        move: 's',
        erase: 'd',
        pick_color: 'f'
      }
    }

    this.state = {
      canvas_size: {},
      web3: null,
      genesis_block: null,
      current_block: null,
      current_color: { r: 255, g: 255, b: 255, a: 255 },
      batch_paint: [],
      event_logs: [],
      keys_down: {},
      x: 0,
      y: 0,
      pending_txs: [],
      settings: stored_settings ? { ...this.default_settings, ...JSON.parse(stored_settings) } : this.default_settings,
      current_tool: 'move'
    }
    this.bootstrap_steps = 3
    this.bootstraped = 0
    this.max_event_logs_size = 100
    this.max_batch_length = 20
    this.events_panel_width = 290
    PriceFormatter.init()
    PriceFormatter.set_unit(this.state.settings.unit)
  }

  componentWillMount() {
    getWeb3
    .then(result => this.setState({ web3: result.web3, web3_watch_only: result.watch_only }, this.instantiate_contract))
    .catch(() => console.log('Error finding web3.'))
  }

  componentDidMount() {
    ElementQueries.init()
  }

  bootstraping() {
    return this.bootstraped < this.bootstrap_steps
  }

  try_bootstrap = () => {
    this.bootstraped++
    if (this.bootstraping())
      return
    this.main_canvas.resize(this.continue_bootstrap)
  }

  continue_bootstrap = new_canvas_size => {
    new ResizeSensor(this.canvas_resize_sensor, this.redraw)
    this.setState({ viewport_size: new_canvas_size }, () => {
      this.current_wheel_zoom = this.whole_canvas_on_viewport_ratio()
      this.point_at_center = { x: this.state.canvas_size.width * 0.5, y: this.state.canvas_size.height * 0.5 }
      let last_cache_index = ContractToWorld.max_index(this.state.genesis_block, this.last_cache_block)
      this.resize_pixel_buffer(this.state.canvas_size, last_cache_index, this.state.max_index)
      this.clear_logs()
      this.start_watching()
      this.update_pixels([])  
    })
  }

  load_canvases = latest_block => {
    this.load_cache_image(latest_block)
    this.load_clear_image()
    this.load_addresses_buffer()
  }

  bucket_url = key => {
    return `https://${ process.env.REACT_APP_S3_BUCKET }.s3.us-east-2.amazonaws.com/${key}?disable_cache=${+ new Date()}`
  }

  load_addresses_buffer = () => {
    axios.get(this.bucket_url('addresses.buf'), { responseType:"arraybuffer" }).then(response => {
      AddressBuffer.decompress_buffer(response.data)
      .then(result => this.address_buffer = new AddressBuffer(result.buffer))
      .catch(error => console.error("Error when inflating cache buffer"))
      .then(this.try_bootstrap)
    })
  }

  load_cache_image = latest_block => {
    axios.get(this.bucket_url('init.json')).then(response => {
      if (this.contract_instance.address === response.data.contract_address) {
        this.last_cache_block = response.data.last_cache_block
        let img = new Image()
        img.crossOrigin = ''
        img.src = this.bucket_url('pixels.png')
        img.style.display = 'none'
        img.onload = this.load_buffer_data.bind(this, img, latest_block)
      }
      else {
        this.last_cache_block = this.state.genesis_block - 2
        this.load_buffer_data(null, latest_block)
      }
    })
  }

  load_clear_image = () => {
    let clear_image = new Image()
    clear_image.src = 'pattern.png'
    clear_image.style.display = 'none'
    clear_image.onload = () => {
      this.main_canvas.set_clear_pattern(clear_image)
      this.minimap_canvas.set_clear_pattern(clear_image)
      this.try_bootstrap()
    }
  }

  load_buffer_data = (img, latest_block) => {
    let new_max_index = ContractToWorld.max_index(this.state.genesis_block, latest_block)
    let dimension = ContractToWorld.canvas_dimension(new_max_index)
    this.create_buffer_canvas(dimension)
    if (img)
      this.pixel_buffer_ctx.drawImage(img, 0.5 * (dimension - img.width), 0.5 * (dimension - img.height))
    this.setState({ current_block: latest_block, max_index: new_max_index, canvas_size: { width: dimension, height: dimension } }, this.try_bootstrap)
  }

  create_buffer_canvas = dimension => {
    this.pixel_buffer_ctx = CanvasUtils.new_canvas(dimension)
    this.preview_buffer_ctx = CanvasUtils.new_canvas(dimension, true)
    this.pending_buffer_ctx = CanvasUtils.new_canvas(dimension, true)
  }

  redraw_ctx = (ctx, destination_top_left, destination_size) => {
    this.main_canvas.drawImage(ctx.canvas,
      0, 0,
      this.state.canvas_size.width, this.state.canvas_size.height,
      destination_top_left.x, destination_top_left.y,
      destination_size.x, destination_size.y)
  }

  redraw = e => {
    let destination_top_left = this.destination_top_left()
    let destination_size = this.destination_size()
    this.main_canvas.resize()
    this.main_canvas.clear()
    this.redraw_ctx(this.pixel_buffer_ctx, destination_top_left, destination_size)
    if (this.state.settings.preview_pending_txs)
      this.redraw_ctx(this.pending_buffer_ctx, destination_top_left, destination_size)
    this.redraw_ctx(this.preview_buffer_ctx, destination_top_left, destination_size)
    this.update_zoom(e)
    this.outline_hovering_pixel()
  }
  
  put_pixels_in_buffer = (pixels, ctx) => {
    pixels.forEach(p => {
      let b_coords = WorldToCanvas.to_buffer(p.x, p.y, ctx.canvas)
      ctx.putImageData(p.image_data(), b_coords.x, b_coords.y)
    })
    this.redraw()
  }

  update_preview_buffer = pixel => {
    this.put_pixels_in_buffer([pixel], this.preview_buffer_ctx)
  }

  update_pending_buffer = () => {
    CanvasUtils.clear(this.pending_buffer_ctx, 'rgba(0,0,0,0)')
    this.state.pending_txs.forEach(tx => {
      this.put_pixels_in_buffer(tx.pixels, this.pending_buffer_ctx)
    })
  }
  
  remove_preview = pixels => {
    pixels.forEach(p => {
      let b_coords = WorldToCanvas.to_buffer(p.x, p.y, this.preview_buffer_ctx.canvas)
      this.preview_buffer_ctx.putImageData(CanvasUtils.transparent_image_data(ImageData), b_coords.x, b_coords.y)
    })
    this.redraw()
  }

  outline_pixel = (world_pixel, soft) => {
    let viewport_coords = WorldToCanvas.to_viewport(world_pixel, this.state.canvas_size, this.point_at_center, this.current_wheel_zoom, this.state.viewport_size)
    this.main_canvas.outline(viewport_coords.x - 2, viewport_coords.y - 2, this.current_wheel_zoom + 4, this.current_wheel_zoom + 4, soft)
  }

  outline_hovering_pixel = () => {
    if (this.state.hovering_pixel) {
      this.outline_pixel(this.state.hovering_pixel, true)
    }
  }

  whole_canvas_on_viewport_ratio = () => {
    if (this.state.viewport_size.width > this.state.viewport_size.height)
      return this.state.viewport_size.height / this.state.canvas_size.height
    else
      return this.state.viewport_size.width / this.state.canvas_size.width
  }

  destination_top_left = () => {
    return {
      x: this.state.viewport_size.width * 0.5 - this.point_at_center.x * this.current_wheel_zoom,
      y: this.state.viewport_size.height * 0.5 - this.point_at_center.y * this.current_wheel_zoom
    }
  }

  destination_size = () => {
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
  
  start_watching = () => {
    let pusher = new Pusher(process.env.REACT_APP_PUSHER_APP_KEY, {
      cluster: process.env.REACT_APP_PUSHER_APP_CLUSTER,
      encrypted: true
    })
    pusher.subscribe('main').bind('new_block', data => this.update_block_number(data.new_block))
    pusher.subscribe('main').bind('new_tx', data => {
      this.process_pixels_painted(data)
      this.update_pending_txs(data)
    })    
  }

  process_pixels_painted = (pusher_tx) => {
    var new_pixels = pusher_tx.pixels.map(p => Pixel.from_event(pusher_tx.tx, pusher_tx.owner, pusher_tx.locked_until, p))
    this.update_pixels(new_pixels)
  }
  
  update_pixels = new_pixels => {
    let events_to_push = new_pixels.map(new_pixel => {
      new_pixel.old_color = this.color_at(new_pixel.x, new_pixel.y)
      let buffer_coords = WorldToCanvas.to_buffer(new_pixel.x, new_pixel.y, this.state.canvas_size)
      this.pixel_buffer_ctx.putImageData(new_pixel.image_data(), buffer_coords.x, buffer_coords.y)
      this.address_buffer.update_pixel(new_pixel)
      return React.createElement(PixelPaintedEvent, { pixel: new_pixel, cooldown_formatter: this.cooldown_formatter, key: new_pixel.to_key() })
    })
    this.push_events(events_to_push)
    this.redraw()
    this.update_minimap()
  }
  
  push_events = events => {
    if (!events.length)
      return
    this.setState(prev_state => {
      let temp = [...prev_state.event_logs]
      temp.unshift(...events)
      if (temp.length > this.max_event_logs_size)
        temp = temp.slice(0, this.max_event_logs_size)
      return { event_logs: temp }
    })
  }

  clear_logs = () => {
    this.setState({ event_logs: []})
  }

  update_zoom = e => {
    if (!(e || this.current_zoom))
      return
    if (e)
      this.current_zoom = { x: e.offsetX, y: e.offsetY }
    this.zoom_canvas.resize()
    this.zoom_canvas.drawImage(this.main_canvas.canvas,
                      Math.abs(this.current_zoom.x - 5),
                      Math.abs(this.current_zoom.y - 5),
                      10, 10,
                      0, 0,
                      this.zoom_canvas.canvas.width, this.zoom_canvas.canvas.height)
  }
  
  update_hovering_pixel = () => {
    let pap = this.pixel_at_pointer()
    this.setState({ hovering_pixel: pap.index <= this.state.max_index ? pap : null }, this.redraw)
  }

  pointer_inside_canvas = pixel_at_pointer => {
    return pixel_at_pointer.is_inside_canvas(this.state.max_index)
  }

  pixel_at_pointer = () => {
    let x = Math.round(this.point_at_center.x - this.state.canvas_size.width / 2 + (this.mouse_position.x - this.state.viewport_size.width * 0.5) / this.current_wheel_zoom)
    let y = - Math.round(this.point_at_center.y - this.state.canvas_size.height / 2 + (this.mouse_position.y - this.state.viewport_size.height * 0.5) / this.current_wheel_zoom)
    let i = new WorldToContract(x, y).get_index()
    let color = this.color_at(x, y)
    let buffer_info = i <= this.state.max_index ? this.address_buffer.entry_at(i) : {}
    return new Pixel(
      x,
      y,
      color,
      buffer_info.address,
      buffer_info.locked_until,
      null,
      i
    )
  }

  main_canvas_mouse_down = e => {
    e.preventDefault()
    if (this.dragging_canvas(e))
      this.start_dragging()
    else
      this.start_painting()
  }

  main_canvas_mouse_move = e => {
    if (!this.point_at_center)
      return
    this.mouse_position = { x: e.offsetX, y: e.offsetY }
    if (this.dragging_canvas(e))
      this.drag()
    else
      if (this.left_click_pressed(e))
        this.start_painting()
      this.update_zoom(e)
    this.update_hovering_pixel()
  }

  main_canvas_mouse_up = e => {
    e.preventDefault()
    if (this.dragging_canvas(e))
      this.drag()
  }

  tool_selected = tool => this.state.current_tool === tool

  wheel_pressed = e => e.buttons & 4

  left_click_pressed = e => e.buttons & 1

  dragging_canvas = e => this.wheel_pressed(e) || (this.tool_selected('move') && this.left_click_pressed(e))

  start_dragging = () => {
    this.drag_start = this.mouse_position
  }

  start_painting = () => {
    let pap = this.pixel_at_pointer()
    if (this.pointer_inside_canvas(pap))
      if (this.tool_selected('paint'))
        this.add_to_batch(pap)
      else
        if (this.tool_selected('pick_color'))      
          this.pick_color(pap)
        else
          this.remove_from_batch(pap)
  }

  drag = () => {
    this.point_at_center.x = this.point_at_center.x - (this.mouse_position.x - this.drag_start.x) / this.current_wheel_zoom
    this.point_at_center.y = this.point_at_center.y - (this.mouse_position.y - this.drag_start.y) / this.current_wheel_zoom
    this.drag_start = this.mouse_position
  }

  pick_color = pixel_at_pointer => {
    let data = this.main_canvas.getImageData(this.mouse_position.x, this.mouse_position.y, 1, 1).data
    this.setState({ current_color: ColorUtils.intArrayToRgb(data) })
    this.save_custom_color(ColorUtils.intArrayToHex(data))
  }

  is_picking_color = () => {
    return this.state.current_tool === 'pick_color'
  }

  save_custom_color = color => {
    let new_colors = new Set(this.state.settings.custom_colors)
    new_colors.add(color) /* IE 11: add doesnt return the Set instance :( */
    this.update_settings({ custom_colors: [...new_colors] })
  }

  clear_custom_colors = e => {
    e.preventDefault()
    this.update_settings({ custom_colors: []})
  }

  update_minimap = () => {
    this.minimap_canvas.resize()
    this.minimap_canvas.clear()
    this.minimap_canvas.drawImage(this.pixel_buffer_ctx.canvas,
                      0, 0,
                      this.state.canvas_size.width, this.state.canvas_size.height,
                      0, 0,
                      this.minimap_canvas.canvas.width, this.minimap_canvas.canvas.height)
  }
  
  update_from_minimap = e => {
    this.point_at_center = {
      x: (e.offsetX / this.minimap_canvas.canvas.width) * this.state.canvas_size.width,
      y: (e.offsetY / this.minimap_canvas.canvas.height) * this.state.canvas_size.height
    }
    this.redraw()
  }

  hold_minimap = e => {
    if (e.button === 0)
      this.dragging_minimap = true
  }

  move_on_minimap = e => {
    if (this.dragging_minimap)
      this.update_from_minimap(e)
  }
  
  release_minimap = e => {
    e.preventDefault()
    this.dragging_minimap = false
    this.update_from_minimap(e)
  }

  wheel_zoom = e => {
    e.preventDefault()
    /* Check whether the wheel event is supported. */
    if (e.type === "wheel") this.wheel_even_supported = true
    else if (this.wheel_even_supported) return
    /* Determine the direction of the scroll (< 0 → up, > 0 → down). */
    var delta = ((e.deltaY || -e.wheelDelta || e.detail) >> 10) || 1
    this.current_wheel_zoom = this.current_wheel_zoom * (delta > 0 ? 0.8 : 1.25)
    this.update_hovering_pixel()
  }

  update_block_number = block_number => {
    let old_max_index = this.state.max_index
    let new_max_index = ContractToWorld.max_index(this.state.genesis_block, block_number)
    let new_dimension = ContractToWorld.canvas_dimension(new_max_index)
    this.setState({ current_block: block_number, max_index: new_max_index, last_updated: new Date() })
    this.resize_pixel_buffer({ width: new_dimension, height: new_dimension }, old_max_index, new_max_index)
  }

  resize_secondary_buffer = (ctx, dimension) => {
    return CanvasUtils.resize_secondary_canvas(ctx, dimension)
  }

  resize_pixel_buffer = (new_size, old_max_index, new_max_index) => {
    this.preview_buffer_ctx = this.resize_secondary_buffer(this.preview_buffer_ctx, new_size.width)
    this.pending_buffer_ctx = this.resize_secondary_buffer(this.pending_buffer_ctx, new_size.width)
    CanvasUtils.resize_canvas(
      this.pixel_buffer_ctx,
      document.createElement('canvas'),
      new_size,
      old_max_index,
      new_max_index,
      CanvasUtils.semitrans_image_data(ImageData),
      (new_ctx, delta_w, delta_h) => {
        this.pixel_buffer_ctx = new_ctx
        this.setState({ canvas_size: new_size }, () => {
          this.point_at_center.x = this.point_at_center.x + delta_w
          this.point_at_center.y = this.point_at_center.y + delta_h
          this.redraw()
          this.update_minimap()
        })
      }
    )
  }

  instantiate_contract = () => {
    const canvas_contract = contract(CanvasContract)
    canvas_contract.setProvider(this.state.web3.currentProvider)
    canvas_contract.deployed().then(instance => {
      this.contract_instance = instance
      
      instance.GenesisBlock.call().then(genesis_block => {
        let g_block = genesis_block.toNumber()
        this.state.web3.eth.getBlockNumber((error, b_number) => {
          if (error)
            console.error(error)
          else
            this.setState({ genesis_block: g_block }, () => {
              this.load_canvases(b_number)
            })
        })
      })

      instance.paint_fee.call().then(fee => this.update_settings({ paint_fee: fee }))
    })

    if (!this.state.web3_watch_only) {
      /* metamask docs say this is the best way to go about this :shrugs: */
      setInterval(this.fetch_account, 1000)
      this.fetch_account()
    }
  }

  fetch_account = () => {
    if (this.state.web3.eth.accounts[0] !== this.state.account) {
      if (this.state.web3.eth.accounts[0])
        LogRocket.identify(this.state.web3.eth.accounts[0])
      this.setState({ account: this.state.web3.eth.accounts[0] })
    }
  }

  update_settings = (new_settings, callback) => {
    let settings = { ...this.state.settings, ...new_settings }
    localStorage.setItem('settings', JSON.stringify(settings))
    this.setState({ settings: settings }, callback)
  }

  color_at = (x, y) => {
    let buffer_coords = WorldToCanvas.to_buffer(x, y, this.state.canvas_size)
    let color_data = this.pixel_buffer_ctx.getImageData(buffer_coords.x, buffer_coords.y, 1, 1).data
    color_data[3] = 255
    return ColorUtils.intArrayToHex(color_data)
  }

  pixel_to_paint = pixel_at_pointer => {
    return pixel_at_pointer.change_color(ColorUtils.rgbToHex(this.state.current_color))
  }

  selected_pixel_in_batch = pixel_at_pointer => {
    pixel_at_pointer = pixel_at_pointer || this.pixel_at_pointer()
    return this.state.batch_paint.findIndex(p => p.same_coords(pixel_at_pointer))
  }

  batch_paint_full = pixel_at_pointer => {
    if (!this.state.batch_paint.length)
      return false
    return this.selected_pixel_in_batch(pixel_at_pointer) === -1 && this.state.batch_paint.length >= this.max_batch_length
  }

  remove_from_batch = pixel => {
    this.remove_preview([pixel])
    this.setState(prev_state => {
      return { batch_paint: prev_state.batch_paint.filter(p => !p.same_coords(pixel)) }
    })
  }

  paint = e => {
    e.preventDefault()
    if (this.state.account) {
      let batch_length = this.state.batch_paint.length
      if (batch_length) {
        (batch_length === 1 ? this.paint_one(this.state.batch_paint[0]) : this.paint_many(batch_length)).catch(error => console.log(error))
        this.store_pending_tx()
        this.clear_batch()
      }
    }
    else
      alert('No account detected, unlock metamask')
  }

  store_pending_tx = () => {
    this.setState(prev_state => {
      const temp = [...prev_state.pending_txs, { pixels: prev_state.batch_paint, caller: prev_state.account }]
      return { pending_txs: temp }
    }, this.update_pending_buffer)
  }

  update_pending_txs = tx_info => {
    this.setState(prev_state => {
      return { pending_txs: LogUtils.remaining_txs(prev_state.pending_txs, tx_info) }
    }, this.update_pending_buffer)
  }

  toggle_preview_pending_txs = () => {
    this.update_settings({ preview_pending_txs: !this.state.settings.preview_pending_txs }, this.redraw)
  }

  paint_many = batch_length => {
    let indexes = []
    let colors = this.state.batch_paint.map((pixel) => {
      indexes.push(pixel.contract_index())
      return pixel.bytes3_color()
    })
    return this.contract_instance.BatchPaint(batch_length, indexes, colors, this.paint_options())
  }

  paint_one = pixel => {
    return this.contract_instance.Paint(pixel.contract_index(), pixel.bytes3_color(), this.paint_options())
  }

  paint_options = () => {
    return { from: this.state.account, value: this.gas_estimator.estimate_fee(this.state.batch_paint), gas: this.gas_estimator.estimate_gas(this.state.batch_paint), gasPrice: this.gas_estimator.gas_price() }
  }

  clear_batch = e => {
    if (e)
      e.preventDefault()
    this.remove_preview(this.state.batch_paint)
    this.setState({ batch_paint: []})
  }

  add_to_batch = pixel_at_pointer => {
    let p = this.pixel_to_paint(pixel_at_pointer)
    if (this.batch_paint_full(pixel_at_pointer))
      return
    let index_to_insert = this.selected_pixel_in_batch(p)
    if (index_to_insert === -1)
      index_to_insert = this.state.batch_paint.length
    else if (this.state.batch_paint[index_to_insert].color === p.color)
      return
    this.update_preview_buffer(p)
    this.setState(prev_state => {
      const temp = [...prev_state.batch_paint]
      temp[index_to_insert] = p
      return { batch_paint: temp }
    })
  }
  
  update_current_color = new_color => {
    this.setState({ current_color: new_color.rgb })
  }
 
  update_key = key_state => {
    this.setState(prev_state => {
      return { keys_down: { ...prev_state.keys_down, ...key_state } }
    }, this.check_for_shortcuts)
  }

  check_for_shortcuts = () => {
    for (var tool in this.state.settings.shortcuts) {
      if (!this.state.settings.shortcuts.hasOwnProperty(tool)) continue
      let shortcut = this.state.settings.shortcuts[tool]
      if (this.state.keys_down[shortcut]) {
        this.select_tool(tool)
        break
      }
    }
  }

  toggle_events = () => {
    this.update_settings({ show_events: !this.state.settings.show_events })
  }

  resize_viewport = (new_size) => {
    this.setState({ viewport_size: new_size }, this.redraw)
  }

  select_tool = (tool) => {
    this.holding_click = false
    this.setState({ current_tool: tool })
  }

  render() {
    let block_info = null
    if (this.state.current_block)
      block_info = (
        <div>
          <p>Genesis block: {this.state.genesis_block}</p>
          <p>
            Blocknumber: {this.state.current_block}
            <LastUpdatedTimer last_updated={this.state.last_updated} />
          </p>
          <p>Pixel supply: {this.state.max_index + 1}</p>
        </div>
      )
    return (
      <div className="App">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Pavlito clabo un clabito</title>
        </Helmet>
        <CooldownFormatter current_block={this.state.current_block} ref={cf => this.cooldown_formatter = cf} />
        <GasEstimator gas_price={this.state.settings.gas_price} fee={this.state.settings.paint_fee} ref={ge => this.gas_estimator = ge} />
        <div ref={n => this.navbar = n}>
          <Navbar>
            <Navbar.Header>
              <Navbar.Brand>
                ETHPaint
              </Navbar.Brand>
            </Navbar.Header>
            <Nav pullRight>
              <NavItem className='account-status'>
                <AccountStatus account={this.state.account} />
              </NavItem>
            </Nav>
          </Navbar>
        </div>
        <main>
          <Grid fluid={true} className='main-container'>
            <Col md={3} className='side-col'>
              <Palette current_color={this.state.current_color} custom_colors={this.state.settings.custom_colors} on_custom_color_save={this.save_custom_color} on_custom_colors_clear={this.clear_custom_colors} on_color_update={this.update_current_color} tools={['pick_color']} on_tool_selected={this.select_tool} current_tool={this.state.current_tool} shortcuts={this.state.settings.shortcuts} />
              <ToolSelector tools={['paint', 'move', 'erase']} on_tool_selected={this.select_tool} current_tool={this.state.current_tool} shortcuts={this.state.settings.shortcuts} />
              {block_info}
              <PendingTxList pending_txs={this.state.pending_txs} gas_estimator={this.gas_estimator} preview={this.state.settings.preview_pending_txs} on_preview_change={this.toggle_preview_pending_txs}>
                <PixelBatch title="Draft" panel_key={'draft'} gas_estimator={this.gas_estimator} on_batch_submit={this.paint} on_batch_clear={this.clear_batch} batch={this.state.batch_paint} max_batch_size={this.max_batch_length} />
              </PendingTxList>
            </Col>
            <Col md={9} className='canvas-col'>
              <div className='canvas-outer-container' ref={cc => this.canvas_container = cc}>
                <div className={`canvas-container ${ this.state.settings.show_events ? 'with-events' : ''}`}>
                  <div className='zoom-canvas'>
                    <Canvas aliasing={false}  ref={c => this.zoom_canvas = c} />
                  </div>
                  <div className='minimap-canvas'>
                    <Canvas on_mouse_up={this.release_minimap} on_mouse_move={this.move_on_minimap} on_mouse_down={this.hold_minimap} aliasing={false} ref={c => this.minimap_canvas = c} />
                  </div>
                  <div className={`resize-sensor ${ this.is_picking_color() ? 'picking-color' : ''}`} ref={rs => this.canvas_resize_sensor = rs}>
                    <Canvas on_mouse_wheel={this.wheel_zoom} on_mouse_down={this.main_canvas_mouse_down} on_mouse_up={this.main_canvas_mouse_up} on_mouse_move={this.main_canvas_mouse_move} on_resize={this.resize_viewport} minimap_ref={this.minimap_canvas} zoom_ref={this.zoom_canvas} aliasing={false} ref={c => this.main_canvas = c} />
                  </div>
                  <HoverInfo pixel={this.state.hovering_pixel} cooldown_formatter={this.cooldown_formatter} />
                </div>
                <EventLogPanel event_logs={this.state.event_logs} on_clear={this.clear_logs} on_tab_click={this.toggle_events} expand={this.state.settings.show_events} slideout_width={this.events_panel_width} cooldown_formatter={this.cooldown_formatter} />
              </div>
            </Col>
          </Grid>
        </main>
        <KeyListener on_key_update={this.update_key} />
      </div>
    )
  }
}

export default App
