import CanvasContract from "../build/contracts/Canvas.json"
import Web3 from 'web3'
import ColorUtils from "./utils/ColorUtils.js"
import ContractToWorld from "./utils/ContractToWorld.js"
import WorldToCanvas from "./utils/WorldToCanvas.js"
import CanvasUtils from "./utils/CanvasUtils.js"
import LogUtils from "./utils/LogUtils.js"

require('dotenv').config({silent: true, path: process.env.ENV_PATH})

const fs = require('fs')
const zlib = require('zlib')
const Canvas = require('canvas')
const left_pad = require('left-pad')
const ProviderEngine = require('web3-provider-engine')
const ZeroClientProvider = require ('web3-provider-engine/zero.js')
const contract = require('truffle-contract')
const canvasContract = contract(CanvasContract)
const Pusher = require('pusher')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const buffer_entry_size = 24 /* 20 bytes for address, 4 bytes for locked_until */
const free_pixel_buffer = Buffer.allocUnsafe(buffer_entry_size).fill('000000000000000000000000000000000000000000000000', 'hex') /* empty address and locked_until */
const new_pixel_image_data = CanvasUtils.semitrans_image_data(Canvas.ImageData)

let canvas = null
let canvas_dimension = null
let pixel_buffer_ctx = null
let address_buffer = new Buffer(0)
let last_cache_block = null
let current_block = null
let max_index = null
let web3 = null
let instance = null
let pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true
})

const bucket = process.env.S3_BUCKET
const pixels_key = 'pixels.png'
const buffer_key = 'addresses.buf'
const init_key = 'init.json'

let get_web3 = () => {
  let provider = null
  if (process.env.NODE_ENV === 'development') {
    console.log('Using development web3')
    provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545')
  }
  else {
    console.log('Using Infura')
    provider = ZeroClientProvider({
      static: {
        eth_syncing: false,
        web3_clientVersion: 'ZeroClientProvider',
      },
      pollingInterval: 99999999, // not interested in polling for new blocks
      rpcUrl: `https://${process.env.INFURA_NETWORK}.infura.io/${process.env.INFURA_API_KEY}`,
      getAccounts: (cb) => cb(null, [])
    })
    provider.start()
  }
  return new Web3(provider)
}

let upload_callback = (err, data) => {
  if (err)
    console.log(err)
  else
    console.log(`New ${data.key}: ${data.ETag}`)
}

let update_cache = () => {
  console.log("Updating cache...")
  s3.upload({ ACL: 'public-read', Bucket: bucket, Key: pixels_key, Body: canvas.toBuffer() }, upload_callback)
  let init_json = JSON.stringify({ contract_address: instance.address, last_cache_block: current_block })
  s3.upload({ ACL: 'public-read', Bucket: bucket, Key: init_key, Body: init_json }, upload_callback)
  let deflated_body = zlib.deflateRawSync(address_buffer)
  s3.upload({ ACL: 'public-read', Bucket: bucket, Key: buffer_key, Body: deflated_body }, upload_callback)
}

let process_new_block = b_number => {
  console.log(`New block: ${b_number}`)
  let old_dimension = canvas_dimension
  let old_index = store_new_index(b_number)
  resize_assets(old_index)
  pusher.trigger('main', 'new_block', { new_block: b_number})
}

let update_pixel = log => {
  let world_coords = ContractToWorld.index_to_coords(log.args.i.toNumber())
  let canvas_coords = WorldToCanvas.to_buffer(world_coords.x, world_coords.y, { width: canvas_dimension, height: canvas_dimension })
  let pixel_array = new Uint8ClampedArray(ColorUtils.bytes3ToIntArray(log.args.new_color))
  let image_data = new Canvas.ImageData(pixel_array, 1, 1)
  pixel_buffer_ctx.putImageData(image_data, canvas_coords.x, canvas_coords.y)
}

let update_buffer = log => {
  let offset = buffer_entry_size * log.args.i.toNumber()
  let formatted_address = log.args.new_owner.substr(2, 40)
  let formatted_locked_until = left_pad(log.args.locked_until.toString(16), 8, 0)
  let entry = formatted_address + formatted_locked_until
  address_buffer.fill(entry, offset, offset + buffer_entry_size, 'hex')
}

let store_new_index = b_number => {
  let old_index = max_index
  current_block = b_number
  max_index = ContractToWorld.max_index(current_block)
  canvas_dimension = ContractToWorld.canvas_dimension(max_index)
  return old_index
}

let resize_canvas = old_i => {
  console.log(`Resizing canvas to: ${canvas_dimension}x${canvas_dimension}...`)
  canvas = new Canvas(canvas_dimension, canvas_dimension) /* pixel_buffer_ctx keeps a temp reference to old canvas */
  pixel_buffer_ctx = CanvasUtils.resize_canvas(
    pixel_buffer_ctx,
    canvas,
    { width: canvas_dimension, height: canvas_dimension },
    old_i,
    max_index,
    new_pixel_image_data
  )
}

let resize_buffer = old_i => {
  console.log(`Resizing buffer to: ${buffer_entry_size * (max_index + 1)}...`)
  address_buffer = Buffer.concat([address_buffer, Buffer.allocUnsafe(buffer_entry_size * (max_index - old_i)).fill(free_pixel_buffer)], buffer_entry_size * (max_index + 1))
}

let resize_assets = old_i => {
  console.log(`Resizing assets: ${old_i} => ${max_index}...`)
  resize_canvas(old_i)
  resize_buffer(old_i)
}

let start_watching = () => {
  process_past_logs(last_cache_block, current_block)
  
  web3.eth.filter("latest").watch((error, block_hash) => {
    web3.eth.getBlock(block_hash, false, (error, result) => {
      if (error)
        console.error(error)
      else {
        let safe_number = result.number - process.env.CONFIRMATIONS_NEEDED
        if (safe_number > current_block) {
          let last_processed_block = current_block
          process_new_block(safe_number)
          process_past_logs(last_processed_block + 1, safe_number)
        }
      }
    })
  })
}

let fetch_events = (event, start, end) => {
  return new Promise(resolve => {
    console.log(`Fetching ${event} logs from ${start} to ${end}`)
    instance[event]({}, { fromBlock: start, toBlock: end }).get((_, result) => resolve(result))
  })
}

let process_past_logs = (start, end) => {
  Promise.all([fetch_events('PixelPainted', start, end), fetch_events('PixelUnavailable', start, end)]).then(values => {
    let txs = {}
    console.log(`Processing ${values[0].length} PixelPainted event${values[0].length == 1 ? '' : 's'}`)
    values[0].forEach(l => {
      update_pixel(l)
      update_buffer(l)
      LogUtils.to_sorted_event(txs, l)
    })
    update_cache()
    console.log(`Processing ${values[1].length} PixelUnavailable event${values[1].length == 1 ? '' : 's'}`)
    values[1].forEach(l => LogUtils.to_sorted_event(txs, l))
    Object.entries(txs).forEach(([tx_hash, tx_info]) => {
      pusher.trigger('main', 'mined_tx', tx_info)
      console.log(`Tx pushed: ${tx_hash}`)
    })
  })
}

let reset_cache = (g_block, b_number) => {
  console.log("Resetting cache...")
  max_index = -1
  last_cache_block = g_block
  process_new_block(b_number)
  start_watching()
}

let continue_cache = (b_number, pixels_data, buffer_data) => {
  console.log('Using stored cache...')
  /* init the canvas with the last cached image */
  let img = new Canvas.Image()
  img.src = "data:image/png;base64," + Buffer.from(pixels_data).toString('base64')
  console.log(`Last cache dimensions: ${img.width}x${img.height}`)
  canvas = new Canvas(img.width, img.height)
  pixel_buffer_ctx = canvas.getContext('2d')
  pixel_buffer_ctx.drawImage(img, 0, 0)
  /* init the buffer with the last cached buffer */
  address_buffer = zlib.inflateRawSync(buffer_data)
  max_index = ContractToWorld.max_index(last_cache_block) /* temp set mat_index to old_index to set old_index to the right value */
  let old_index = store_new_index(b_number)
  resize_assets(old_index)
  start_watching()
}

let fetch_pixels = (g_block, b_number) => {
  console.log(`Reading ${bucket}/${pixels_key}...`)
  s3.getObject({ Bucket: bucket, Key: pixels_key }, (error, pixels_data) => {
    if (error) {
      console.log('Last pixels file not found')
      reset_cache(g_block, b_number)
    }
    else
      fetch_buffer(g_block, b_number, pixels_data.Body)
  })
}

let fetch_buffer = (g_block, b_number, pixels_data) => {
  console.log(`Reading ${bucket}/${buffer_key}...`)
  s3.getObject({ Bucket: bucket, Key: buffer_key }, (error, buffer_data) => {
    if (error) {
      console.log('Last buffer file not found')
      reset_cache(g_block, b_number)
    }
    else
      continue_cache(b_number, pixels_data, buffer_data.Body)
  })
}

web3 = get_web3()
canvasContract.setProvider(web3.currentProvider)
canvasContract.deployed().then((contract_instance) => {
  var matching_contract = false
  instance = contract_instance
  console.log(`Contract deployed\nFetching halving information...`)
  instance.HalvingInfo.call().then(halving_info => {
    let g_block = halving_info[0].toNumber()
    ContractToWorld.init(halving_info)
    console.log(`Halving array: ${ halving_info }\nFetching init.json...`)
    s3.getObject({ Bucket: bucket, Key: init_key }, (error, data) => {
      if (error)
        console.log('File init.json not found')
      else {
        let json_data = JSON.parse(data.Body.toString())
        last_cache_block = json_data.last_cache_block
        console.log(`Last block cached: ${ last_cache_block }`)
        let cache_address = json_data.contract_address
        matching_contract = cache_address === instance.address
      }
      console.log('Fetching current block...')
      web3.eth.getBlockNumber((error, b_number) => {
        if (error)
          throw error
        else {
          let safe_number = b_number - process.env.CONFIRMATIONS_NEEDED
          if (matching_contract)
            fetch_pixels(g_block, safe_number)
          else {
            console.log('Last cache files point to older contract version, resetting cache...')
            reset_cache(g_block, safe_number)
          }
          setInterval(() => { console.log("Listening for events...") }, 60000)
        }
      })
    })
  })
})