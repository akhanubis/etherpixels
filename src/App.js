import React, { PureComponent } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'
import {Helmet} from "react-helmet"
import { Col, Grid, Button } from 'react-bootstrap'
import Pixel from './Pixel'
import HoverInfo from './HoverInfo'
import ColorUtils from './utils/ColorUtils'
import ContractToWorld from './utils/ContractToWorld'
import WorldToCanvas from './utils/WorldToCanvas'
import WorldToContract from './utils/WorldToContract'
import CanvasUtils from './utils/CanvasUtils'
import Canvas from './Canvas'
import Draft from './Draft'
import KeyListener from './KeyListener'
import axios from 'axios'
import AddressBuffer from './AddressBuffer'
import Pusher from 'pusher-js'
import PendingTxList from './PendingTxList'
import PriceFormatter from './utils/PriceFormatter'
import EventLogPanel from './EventLogPanel'
import Topbar from './Topbar'
import Footer from './Footer'
import Palette from './Palette'
import ToolSelector from './ToolSelector'
import BlockInfo from './BlockInfo'
const contract = require('truffle-contract')
import { ElementQueries, ResizeSensor } from 'css-element-queries'
import Alert from 'react-s-alert'
import NameUtils from './utils/NameUtils'
import LoadingPanel from './LoadingPanel'
import Settings from './Settings'
import CssHide from './CssHide'
import LogRocket from 'logrocket'
import EnvironmentManager from './utils/EnvironmentManager'
import BigNumber from 'bignumber.js'

import './css/bootstrap.min.css'
import './App.css'
import 'react-s-alert/dist/s-alert-default.css'
import 'react-s-alert/dist/s-alert-css-effects/slide.css'

class App extends PureComponent {
  constructor(props) {
    super(props)

    let stored_settings = localStorage.getItem('settings')
    this.default_settings = {
      unit: 'gwei',
      humanized_units: true,
      gas_price: 1000000000 /* 1 gwei */,
      custom_colors: [],
      default_price_increase: 20,
      zoom_at_pointer: true
    }
    this.state = {
      canvas_size: {},
      web3: null,
      current_block: null,
      current_color: { r: 255, g: 255, b: 255, a: 255 },
      event_logs: [],
      keys_down: {},
      x: 0,
      y: 0,
      pending_txs: [],
      settings: stored_settings ? { ...this.default_settings, ...JSON.parse(stored_settings) } : this.default_settings,
      current_tool: 'paint',
      shortcuts: {
        paint: 'a',
        move: 's',
        erase: 'd',
        undo: ['Control', 'z'],
        redo: ['Control', 'y'],
        pick_color: 'f',
        fullscreen: 'g',
        reset_view: 'r'
      },
      loading_progress: 0
    }
    this.bootstrap_steps = 3
    this.bootstraped = 0
    this.max_event_logs_size = 20
    this.right_panel_width = 300
    this.weak_map_for_keys = new WeakMap()
    this.weak_map_count = 0
    this.pixel_at_pointer = {
      x: -9999,
      y: -9999
    }
    PriceFormatter.init(this.state.settings.unit, this.state.settings.humanized_units)
  }

  set_state_with_promise = (...args) => {
    return new Promise(resolve => this.setState(...args, resolve))
  }

  componentWillMount() {
    getWeb3
    .then(result => this.set_state_with_promise({ web3: result.web3, web3_watch_only: result.watch_only }))
    .then(this.instantiate_contract)
    .catch(() => console.log('Error finding web3.'))
  }

  componentDidMount() {
    ElementQueries.init()
  }

  update_palette_height = new_height => this.setState({ current_palette_height: new_height })

  update_progress = () => this.setState(prev_state => ({ loading_progress: prev_state.loading_progress + 20}))

  bootstraping = () => this.bootstraped < this.bootstrap_steps

  try_bootstrap = () => {
    this.update_progress()
    this.bootstraped++
    if (this.bootstraping())
      return
    this.main_canvas.resize(this.continue_bootstrap)
  }

  continue_bootstrap = new_canvas_size => {
    new ResizeSensor(this.canvas_resize_sensor, this.redraw)
    this.set_state_with_promise({ viewport_size: new_canvas_size })
    .then(() => {
      let last_cache_index = ContractToWorld.max_index(this.last_cache_block)
      this.reset_view()
      this.resize_pixel_buffer(this.state.canvas_size, last_cache_index, this.state.max_index)
      this.clear_logs()
      this.start_watching()
      this.minimap_canvas.resize()
      this.zoom_canvas.resize()
      this.update_progress()
    })
  }

  load_canvases = () => {
    this.load_cache_image()
    this.load_clear_image()
    this.load_addresses_buffer()
  }

  bucket_url = key => {
    return `https://${ EnvironmentManager.get('REACT_APP_S3_BUCKET') }.s3.us-east-2.amazonaws.com/${key}?disable_cache=${+ new Date()}`
  }

  load_addresses_buffer = () => {
    this.state.contract_instance.StartingPrice.call().then(starting_price => {
      axios.get(this.bucket_url('addresses.buf'), { responseType:"arraybuffer" }).then(response => {
        AddressBuffer.decompress_buffer(response.data)
        .then(result => this.address_buffer = new AddressBuffer(result.buffer, starting_price))
        .catch(error => console.error("Error when inflating cache buffer"))
        .then(this.try_bootstrap)
      })
    })
  }

  load_cache_image = () => {
    axios.get(this.bucket_url('init.json')).then(response => {
      if (this.state.contract_instance.address === response.data.contract_address) {
        this.last_cache_block = response.data.last_cache_block
        let img = new Image()
        img.crossOrigin = ''
        img.src = this.bucket_url('pixels.png')
        img.style.display = 'none'
        img.onload = this.load_buffer_data.bind(this, img)
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
      this.zoom_canvas.set_clear_pattern(clear_image)
      this.try_bootstrap()
    }
  }

  load_buffer_data = img => {
    let new_max_index = ContractToWorld.max_index(this.last_cache_block)
    let dimension = ContractToWorld.canvas_dimension(new_max_index)
    this.create_buffer_canvas(dimension)
    if (img)
      this.pixel_buffer_ctx.drawImage(img, 0.5 * (dimension - img.width), 0.5 * (dimension - img.height))
    this.set_state_with_promise({ canvas_size: { width: dimension, height: dimension } })
    .then(this.on_new_block_state.bind(this, this.last_cache_block, new_max_index))
    .then(this.try_bootstrap)
  }

  reset_view = () => {
    this.current_wheel_zoom = this.whole_canvas_on_viewport_ratio()
    this.point_at_center = { x: this.state.canvas_size.width * 0.5, y: this.state.canvas_size.height * 0.5 }
    this.redraw()
  }

  create_buffer_canvas = dimension => {
    this.pixel_buffer_ctx = CanvasUtils.new_canvas(dimension)
    this.preview_buffer_ctx = CanvasUtils.new_canvas(dimension, true)
    this.empty_canvas_ctx = CanvasUtils.new_canvas(dimension, true)
  }

  redraw_ctx = (ctx, destination_top_left, destination_size) => {
    this.main_canvas.drawImage(ctx.canvas,
      0, 0,
      this.state.canvas_size.width, this.state.canvas_size.height,
      destination_top_left.x, destination_top_left.y,
      destination_size.x, destination_size.y)
  }

  redraw = () => {
    let destination_top_left = this.destination_top_left()
    let destination_size = this.destination_size()
    this.main_canvas.resize()
    this.main_canvas.clear()
    this.redraw_ctx(this.pixel_buffer_ctx, destination_top_left, destination_size)
    this.redraw_ctx(this.preview_buffer_ctx, destination_top_left, destination_size)
    this.update_zoom()
    this.update_minimap()
    this.outline_hovering_pixel()
  }
  
  put_pixels_in_preview = pixels => {
    pixels.forEach(p => {
      let b_coords = WorldToCanvas.to_buffer(p.x, p.y, this.preview_buffer_ctx.canvas)
      this.preview_buffer_ctx.putImageData(p.image_data(), b_coords.x, b_coords.y)
    })
  }

  update_preview_buffer = (preview_draft, draft_pixels) => {
    if (preview_draft !== undefined) {
      this.last_preview_draft = preview_draft
      this.last_draft_pixels = draft_pixels
    }
    this.preview_buffer_ctx.putImageData(this.empty_canvas_data, 0, 0)
    this.state.pending_txs.forEach(tx => {
      if (tx.preview)
        this.put_pixels_in_preview(tx.pixels)
    })
    if (this.last_preview_draft)
      this.put_pixels_in_preview(this.last_draft_pixels)
    this.redraw()
  }

  update_pending_buffer = () => {
    let pixels = this.state.pending_txs.reduce((a, tx) => a.concat(tx.pixels), [])
    this.put_pixels_in_buffer(pixels, this.pending_buffer_ctx)
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
    this.pusher = new Pusher(EnvironmentManager.get('REACT_APP_PUSHER_APP_KEY'), {
      cluster: EnvironmentManager.get('REACT_APP_PUSHER_APP_CLUSTER'),
      encrypted: true,
      disableStats: true
    })
    this.pusher.subscribe('main').bind('new_block', this.update_block_number)
    this.pusher.subscribe('main').bind('server_message', this.show_server_message)
    this.pusher.subscribe('main').bind('mined_tx', this.process_new_tx)
  }

  show_server_message = ({ type, message}) => {
    Alert[type](message)
  }

  process_new_tx = pusher_tx => {
    if (this.state.pending_txs.find(tx => tx.hash === pusher_tx.hash))
      this.remove_mined_tx(pusher_tx)
    let event_pixels = this.paint_pixels_from_tx(pusher_tx)
    pusher_tx.pixels = event_pixels
    this.notify_sold_pixels(pusher_tx)
    this.add_tx_to_events(pusher_tx)
  }
  
  paint_pixels_from_tx = tx => {
    let event_pixels = tx.pixels.map(new_pixel => {
      let p = Pixel.from_event(tx.owner, new_pixel)
      p.old_color = this.color_at(p.x, p.y)
      if (p.painted) {
        let buffer_coords = WorldToCanvas.to_buffer(p.x, p.y, this.state.canvas_size)
        this.pixel_buffer_ctx.putImageData(p.image_data(), buffer_coords.x, buffer_coords.y)
        this.address_buffer.update_pixel(p)
      }
      return p
    })
    this.redraw()
    return event_pixels
  }
  
  notify_sold_pixels = tx => {
    if (this.state.account && tx.owner !== this.state.account) {
      let sold_pixels = tx.pixels.filter(p => p.old_owner === this.state.account)
      let total = sold_pixels.reduce((t, p) => t.add(p.price), new BigNumber(0))
      if (sold_pixels.length)
        Alert.success(`You sold ${ sold_pixels.length } pixel${ sold_pixels.length === 1 ? '' : 's' } for ${ PriceFormatter.format(total.toNumber()) }`)
    }
  }

  add_tx_to_events = tx => {
    this.setState(prev_state => {
      let temp = [...prev_state.event_logs]
      temp.unshift(tx)
      if (temp.length > this.max_event_logs_size)
        temp = temp.slice(0, this.max_event_logs_size)
      return { event_logs: temp }
    })
  }

  clear_logs = () => {
    this.setState({ event_logs: []})
  }

  update_zoom = () => {
    if (!this.pixel_at_pointer)
      return
    this.zoom_canvas.clear()
    let source = WorldToCanvas.to_buffer(this.pixel_at_pointer.x - 3, this.pixel_at_pointer.y + 3, this.pixel_buffer_ctx.canvas)
    let draw_settings = [source.x, source.y,
                         7, 7,
                         0, 0,
                         this.zoom_canvas.canvas.width, this.zoom_canvas.canvas.height]
    this.zoom_canvas.drawImage(this.pixel_buffer_ctx.canvas, ...draw_settings)
    this.zoom_canvas.drawImage(this.preview_buffer_ctx.canvas, ...draw_settings)
  }
  
  update_hovering_pixel = () => {
    this.setState({ hovering_pixel: this.pixel_at_pointer.index <= this.state.max_index ? this.pixel_at_pointer : null }, this.redraw)
  }

  pointer_inside_canvas = () => this.pixel_at_pointer.is_inside_canvas(this.state.max_index)

  update_pixel_at_pointer = (force) => {
    if (!this.mouse_position)
      return
    let x = Math.round(this.point_at_center.x - this.state.canvas_size.width / 2 + (this.mouse_position.x - this.state.viewport_size.width * 0.5) / this.current_wheel_zoom)
    let y = - Math.round(this.point_at_center.y - this.state.canvas_size.height / 2 + (this.mouse_position.y - this.state.viewport_size.height * 0.5) / this.current_wheel_zoom)
    if (force || this.pixel_at_pointer.x !== x || this.pixel_at_pointer.y !== y) {
      let i = new WorldToContract(x, y).get_index()
      let color = this.color_at(x, y)
      let buffer_info = i <= this.state.max_index ? this.address_buffer.entry_at(i) : {}
      this.pixel_at_pointer = new Pixel(
        x,
        y,
        color,
        buffer_info.address,
        buffer_info.price,
        null,
        i
      )
    }
  }

  pixel_to_paint = () => this.pixel_at_pointer.change_color(ColorUtils.rgbToHex(this.state.current_color))

  main_canvas_mouse_down = e => {
    e.preventDefault()
    if (this.dragging_canvas(e))
      this.start_dragging()
    else
      this.click_on_pixel_handler()
  }

  main_canvas_mouse_move = e => {
    if (!this.point_at_center)
      return
    this.mouse_position = { x: e.offsetX, y: e.offsetY }
    this.update_pixel_at_pointer()
    if (this.dragging_canvas(e))
      this.drag()
    else
      if (this.left_click_pressed(e))
        this.click_on_pixel_handler()
      this.update_zoom()
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

  click_on_pixel_handler = () => {
    if (this.pointer_inside_canvas())
      if (this.tool_selected('paint'))
        this.paint_pixel()
      else
        if (this.tool_selected('pick_color'))
          this.pick_color()
        else
          this.erase_pixel()
  }

  paint_pixel = () => {
    this.draft.add(this.pixel_to_paint())
    this.pending_tx_list.expand_draft()
  }

  erase_pixel = () => {
    this.draft.remove(this.pixel_at_pointer)
    this.pending_tx_list.expand_draft()
  }

  drag = () => {
    this.point_at_center.x = this.point_at_center.x - (this.mouse_position.x - this.drag_start.x) / this.current_wheel_zoom
    this.point_at_center.y = this.point_at_center.y - (this.mouse_position.y - this.drag_start.y) / this.current_wheel_zoom
    this.drag_start = this.mouse_position
  }

  pick_color = () => {
    let data = this.main_canvas.getImageData(this.mouse_position.x, this.mouse_position.y, 1, 1).data
    this.setState({ current_color: ColorUtils.intArrayToRgb(data) })
    this.save_custom_color(ColorUtils.intArrayToHex(data))
  }

  save_custom_color = hex_color => {
    let new_colors = new Set(this.state.settings.custom_colors)
    new_colors.add(hex_color) /* IE 11: add doesnt return the Set instance :( */
    this.update_settings({ custom_colors: [...new_colors] })
  }

  remove_custom_color = hex_color => {
    const temp = [...this.state.settings.custom_colors]
    let index_to_remove = temp.findIndex(c => c === hex_color)
    if (index_to_remove !== -1) {
      temp.splice(index_to_remove, 1)
      this.update_settings({ custom_colors: temp})
    }
  }

  update_minimap = () => {
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
    delta = delta > 0 ? 0.8 : 1.25
    if (this.state.settings.zoom_at_pointer) {
      let old_mouse_pos = {
        x: this.mouse_position.x - 0.5 * this.state.viewport_size.width,
        y: this.mouse_position.y - 0.5 * this.state.viewport_size.height
      }
      this.current_wheel_zoom = this.current_wheel_zoom * delta
      this.point_at_center.x -= old_mouse_pos.x * (1 - delta) / this.current_wheel_zoom
      this.point_at_center.y -= old_mouse_pos.y * (1 - delta) / this.current_wheel_zoom
    }
    else
      this.current_wheel_zoom = this.current_wheel_zoom * delta
    this.redraw()
  }

  on_new_block_state = (new_block, new_max_index) => this.set_state_with_promise({ current_block: new_block, max_index: new_max_index, last_updated: new Date() })

  update_block_number = ({ new_block }) => {
    let new_max_index = ContractToWorld.max_index(new_block)
    let new_dimension = ContractToWorld.canvas_dimension(new_max_index)
    this.resize_pixel_buffer({ width: new_dimension, height: new_dimension }, this.state.max_index, new_max_index)
    this.on_new_block_state(new_block, new_max_index).then(this.update_pixel_at_pointer.bind(this, true))
  }

  resize_secondary_buffer = (ctx, dimension) => {
    return CanvasUtils.resize_secondary_canvas(ctx, dimension)
  }

  resize_pixel_buffer = (new_size, old_max_index, new_max_index) => {
    this.preview_buffer_ctx = this.resize_secondary_buffer(this.preview_buffer_ctx, new_size.width)
    this.empty_canvas_ctx = this.resize_secondary_buffer(this.empty_canvas_ctx, new_size.width)
    this.empty_canvas_data = this.empty_canvas_ctx.getImageData(0, 0, new_size.width, new_size.height)
    let result = CanvasUtils.resize_canvas(
      this.pixel_buffer_ctx,
      document.createElement('canvas'),
      new_size,
      old_max_index,
      new_max_index,
      CanvasUtils.semitrans_image_data(ImageData)
    )
    this.pixel_buffer_ctx = result.ctx
    this.setState({ canvas_size: new_size }, () => {
      this.point_at_center.x = this.point_at_center.x + result.delta.width
      this.point_at_center.y = this.point_at_center.y + result.delta.height
      this.redraw()
    })
  }

  instantiate_contract = () => {
    if (!this.state.web3_watch_only) {
      /* metamask docs say this is the best way to go about this :shrugs: */
      setInterval(this.fetch_account, 1000)
      this.fetch_account()
    }

    this.state.web3.version.getNetwork((_, network_id) => {
      EnvironmentManager.init(network_id)
      NameUtils.init()
      .then(() => {
        let n = NameUtils.name(this.state.account)
        this.setState({ name: n === this.state.account ? '' : n })
      })
      .then(this.update_progress)

      this.logrocket_app_id = EnvironmentManager.get('REACT_APP_LOGROCKET_APP_ID')
      if (this.logrocket_app_id)
        LogRocket.init(this.logrocket_app_id)

      const canvas_contract = contract(CanvasContract)
      canvas_contract.setProvider(this.state.web3.currentProvider)
      canvas_contract.deployed().then(instance => {
        this.setState({ contract_instance: instance })
        instance.HalvingInfo.call().then(halving_info => {
          ContractToWorld.init(halving_info)
          this.load_canvases()
        })
      })
    })
  }

  fetch_account = () => {
    this.state.web3.eth.getAccounts((_, accounts) => {
      let new_acc = accounts[0]
      if (new_acc !== this.state.account) {
        let n = NameUtils.name(new_acc)
        this.setState({ account: new_acc, name: n === new_acc ? '' : n  })
        if (new_acc && this.logrocket_app_id)
          LogRocket.identify(new_acc)
      }
    })
  }

  update_settings = (new_settings, callback) => {
    let settings = { ...this.state.settings, ...new_settings }
    localStorage.setItem('settings', JSON.stringify(settings))
    this.setState({ settings: settings }, callback)
  }

  update_name = new_name => {
    NameUtils.submit_name(new_name, this.state.account, this.state.web3.currentProvider, () => this.setState({ name: new_name }))
  }

  color_at = (x, y) => {
    let buffer_coords = WorldToCanvas.to_buffer(x, y, this.state.canvas_size)
    let color_data = this.pixel_buffer_ctx.getImageData(buffer_coords.x, buffer_coords.y, 1, 1).data
    color_data[3] = 255
    return ColorUtils.intArrayToHex(color_data)
  }

  notify_mined_tx = tx_info => {
    let tx_short_hash = tx_info.hash.substr(0, 7)
    if (tx_info.pixels.every(p => p.painted))
      Alert.success(`Tx #${tx_short_hash}... has been fully painted`)
    else if (tx_info.pixels.some(p => p.painted))
      Alert.warning(`Tx #${tx_short_hash}... has been partially painted`)
    else
      Alert.error(`Tx #${tx_short_hash}... has not been painted`)
  }

  send_tx = (tx_payload, pixels, callback) => {
    this.state.web3.eth.sendTransaction(tx_payload.params[0], (err, hash) => {
      if (hash) {
        this.setState(prev_state => {
          const temp = [...prev_state.pending_txs, { preview: true, pixels: pixels, owner: prev_state.account, hash: hash }]
          return { pending_txs: temp }
        }, callback)
      }
    })
  }

  remove_mined_tx = tx_info => {
    this.notify_mined_tx(tx_info)
    this.setState(prev_state => ({ pending_txs: prev_state.pending_txs.filter(p_tx => p_tx.hash !== tx_info.hash) }), this.update_preview_buffer)
  }

  toggle_preview_pending_tx = tx_hash => {
    let tx_index = this.state.pending_txs.findIndex(tx => tx.hash === tx_hash)
    if (tx_index !== -1)
      this.setState(prev_state => {
        const temp = [...prev_state.pending_txs]
        temp[tx_index].preview = !temp[tx_index].preview
        return { pending_txs: temp }
      }, this.update_preview_buffer)
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
    Object.entries(this.state.shortcuts).forEach(([tool, key]) => {
      key = Array.from(key)
      if (key.every(k => this.state.keys_down[k])) {
        this.select_tool(tool)
        return false
      }
    })
  }

  toggle_events = () => {
    this.update_settings({ show_events: !this.state.settings.show_events, show_settings: false })
  }

  toggle_settings = e => {
    e.preventDefault()
    this.update_settings({ show_events: false, show_settings: !this.state.settings.show_settings })
  }

  resize_viewport = (new_size) => {
    this.setState({ viewport_size: new_size }, this.redraw)
  }

  select_tool = (tool) => {
    this.holding_click = false
    if (tool === 'fullscreen') {
      this.update_settings({ show_events: false, show_settings: false })
      this.setState(prev_state => ({ fullscreen: !prev_state.fullscreen }))
    }
    else if (tool === 'reset_view')
      this.reset_view()
    else if (tool === 'undo')
      this.undo()
    else if (tool === 'redo')
      this.redo()
    else
      this.setState({ current_tool: tool })
  }

  undo = () => {
    this.draft.rollback()
  }

  redo = () => {
    this.draft.rollforward()
  }

  exit_fullscreen = e => {
    e.preventDefault()
    this.setState({ fullscreen: false })
  }

  canvas_container_style = () => ({ marginRight: this.state.settings.show_events || this.state.settings.show_settings ? this.right_panel_width : 0 })

  loading_style = () => {
    let blur = `blur(${-0.1 * this.state.loading_progress + 10}px)`
    return {
      WebkitFilter: blur,
      MozFilter: blur,
      OFilter: blur,
      msFilter: blur,
      filter: blur
    }
  }

  render() {
    return ([
      <div className="App" key="1" style={this.loading_style()}>
        <Helmet>
          <meta charSet="utf-8" />
          <title>Pavlito clabo un clabito</title>
          <script defer src="https://use.fontawesome.com/releases/v5.0.6/js/all.js" />
        </Helmet>
        <CssHide hide={this.state.fullscreen}>
          <Topbar name={this.state.account ? this.state.name : 'No account detected'} account={this.state.account} toggle_settings={this.toggle_settings} />
          <Footer />
        </CssHide>
        <main className={this.state.fullscreen ? 'fullscreen' : ''}>
          <Grid fluid={true} className='main-container'>
            <CssHide hide={this.state.fullscreen}>
              <Col md={3} className={`side-col ${this.state.fullscreen ? 'fullscreen-hide' : ''}`}>
                <BlockInfo current={this.state.current_block} max_index={this.state.max_index} />
                <div className='palette-container' style={{height: this.state.current_palette_height}}>
                  <Palette current_color={this.state.current_color} custom_colors={this.state.settings.custom_colors} on_custom_color_save={this.save_custom_color} on_custom_color_remove={this.remove_custom_color} on_color_update={this.update_current_color} on_height_change={this.update_palette_height} />
                </div>
                <ToolSelector tools={['paint', 'move', 'erase', 'pick_color', 'undo', 'redo', 'fullscreen', 'reset_view']} on_tool_selected={this.select_tool} current_tool={this.state.current_tool} shortcuts={this.state.shortcuts} />
                <PendingTxList ref={ptl => this.pending_tx_list = ptl} palette_height={this.state.current_palette_height} pending_txs={this.state.pending_txs} on_preview_change={this.toggle_preview_pending_tx}>
                  <Draft ref={d => this.draft = d } on_send={this.send_tx} on_update={this.update_preview_buffer} contract_instance={this.state.contract_instance} account={this.state.account} default_price_increase={this.state.settings.default_price_increase} gas_price={this.state.settings.gas_price} />
                </PendingTxList>
              </Col>
            </CssHide>
            <Col md={this.state.fullscreen ? 12 : 9} className='canvas-col'>
              <div className='canvas-outer-container' ref={cc => this.canvas_container = cc}>
                <div className="canvas-container" style={this.canvas_container_style()}>
                  <div className='zoom-canvas'>
                    <Canvas aliasing={false}  ref={c => this.zoom_canvas = c} />
                  </div>
                  <div className='minimap-canvas'>
                    <Canvas on_mouse_up={this.release_minimap} on_mouse_move={this.move_on_minimap} on_mouse_down={this.hold_minimap} aliasing={false} ref={c => this.minimap_canvas = c} />
                  </div>
                  <div className={`resize-sensor ${this.state.current_tool}`} ref={rs => this.canvas_resize_sensor = rs}>
                    <Canvas on_mouse_wheel={this.wheel_zoom} on_mouse_down={this.main_canvas_mouse_down} on_mouse_up={this.main_canvas_mouse_up} on_mouse_move={this.main_canvas_mouse_move} on_resize={this.resize_viewport} minimap_ref={this.minimap_canvas} zoom_ref={this.zoom_canvas} aliasing={false} ref={c => this.main_canvas = c} />
                  </div>
                  <HoverInfo pixel={this.state.hovering_pixel} current_block={this.state.current_block} />
                  <CssHide hide={!this.state.fullscreen}>
                    <div className='exit-fullscreen-icon'>
                      <Button bsStyle="primary" onClick={this.exit_fullscreen}>
                        Exit
                      </Button>
                    </div>
                  </CssHide>
                </div>
                <CssHide hide={this.state.fullscreen}>
                  <EventLogPanel event_logs={this.state.event_logs} settings_expanded={this.state.settings.show_settings} on_clear={this.clear_logs} on_tab_click={this.toggle_events} expand={this.state.settings.show_events} panel_width={this.right_panel_width} account={this.state.account} current_block={this.state.current_block} />
                </CssHide>
                <CssHide hide={this.state.fullscreen}>
                  <Settings expand={this.state.settings.show_settings} panel_width={this.right_panel_width} account={this.state.account} settings={this.state.settings} on_update={this.update_settings} on_name_update={this.update_name} name={this.state.name} />
                </CssHide>
              </div>
            </Col>
          </Grid>
          <Alert stack={{limit: 3}} position="top-right" offset={30} effect="slide" html={false} />
        </main>
        <KeyListener on_key_update={this.update_key} />
      </div>,
      <LoadingPanel key="2" progress={this.state.loading_progress} />
    ])
  }
}

export default App
