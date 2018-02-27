import EtherpixelsContract from "../build/contracts/Etherpixels.json"
import ColorUtils from "./utils/ColorUtils.js"
import ContractToWorld from "./utils/ContractToWorld.js"
import WorldToCanvas from "./utils/WorldToCanvas.js"
import CanvasUtils from "./utils/CanvasUtils.js"
import LogUtils from "./utils/LogUtils.js"

require('http').globalAgent.maxSockets = require('https').globalAgent.maxSockets = 20
require('dotenv').config({silent: true, path: process.env.ENV_PATH})

process.on('warning', e => console.warn(e.stack));

const zlib = require('zlib')
const Canvas = require('canvas')
const left_pad = require('left-pad')

const ProviderEngine = require('web3-provider-engine')
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')

const canvasContract = require('truffle-contract')(EtherpixelsContract)

const buffer_entry_size = 32 /* 20 bytes for address, 12 bytes for locked_until */
const free_pixel_buffer_entry = '0000000000000000000000000000000000000000000000000000048c27395000' /* empty address and 5000000000000 starting price */
const new_pixel_image_data = CanvasUtils.semitrans_image_data(Canvas.ImageData)
const new_pixel_price_data = CanvasUtils.new_price_data(Canvas.ImageData)

const admin = require('firebase-admin')
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_APP_NAME,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${ process.env.FIREBASE_PRIVATE_KEY }\n-----END PRIVATE KEY-----\n`
  }),
  databaseURL: `https://${process.env.FIREBASE_APP_NAME}.firebaseio.com`,
  storageBucket: `${process.env.FIREBASE_APP_NAME}.appspot.com`
})
const bucket_ref = admin.storage().bucket()
const pixels_file_name = 'pixels.png'
const prices_file_name = 'prices.png'
const buffer_file_name = 'addresses.buf'
const init_file_name = 'init.json'

let canvas_dimension, pixel_buffer_ctx, prices_ctx, last_cache_block, current_block, max_index, instance, provider, logs_formatter
let address_buffer = Buffer.alloc(0)

let init_provider = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Using development web3')
    let w = require('web3')
    provider = new w.providers.HttpProvider('http://127.0.0.1:9545')
  }
  else {
    console.log('Using Infura')
    provider = new ProviderEngine()
    provider.addProvider(new FilterSubprovider())
    provider.addProvider(new RpcSubprovider({
      rpcUrl: `https://${process.env.INFURA_NETWORK}.infura.io/${process.env.INFURA_API_KEY}`,
    }))
    provider.on('error', err => console.error(err.stack))
    provider.start()
  }
}

let wrap_upload = (filename, content) => {
  bucket_ref.file(filename).save(content)
  .then(() => { console.log(`${filename} uploaded`) })
  .catch(() => { console.log(`${filename} upload failed`) })
}

let update_cache = () => {
  console.log("Updating cache...")
  wrap_upload(pixels_file_name, pixel_buffer_ctx.canvas.toBuffer())
  wrap_upload(prices_file_name, prices_ctx.canvas.toBuffer())
  wrap_upload(init_file_name, JSON.stringify({ contract_address: instance.address, last_cache_block: current_block }))
  wrap_upload(buffer_file_name, zlib.deflateRawSync(address_buffer))
}

let process_new_block = b_number => {
  console.log('================================')
  console.log(`New block: ${b_number}`)
  let old_dimension = canvas_dimension
  let old_index = store_new_index(b_number)
  resize_assets(old_index)
}

let update_pixel = log => {
  let world_coords = ContractToWorld.index_to_coords(log.args.i.toNumber())
  let canvas_coords = WorldToCanvas.to_buffer(world_coords.x, world_coords.y, { width: canvas_dimension, height: canvas_dimension })
  let pixel_array = new Uint8ClampedArray(ColorUtils.bytes3ToIntArray(log.args.new_color))
  let pixel_image_data = new Canvas.ImageData(pixel_array, 1, 1)
  pixel_buffer_ctx.putImageData(pixel_image_data, canvas_coords.x, canvas_coords.y)
  let price_image_data = new Canvas.ImageData(ColorUtils.priceAsColor(log.args.price), 1, 1)
  prices_ctx.putImageData(price_image_data, canvas_coords.x, canvas_coords.y)
}

let update_buffer = log => {
  let offset = buffer_entry_size * log.args.i.toNumber()
  let formatted_address = log.args.new_owner.substr(2, 40)
  let formatted_price = left_pad(log.args.price.toString(16), 24, 0)
  let entry = formatted_address + formatted_price
  address_buffer.fill(entry, offset, offset + buffer_entry_size, 'hex')
}

let store_new_index = b_number => {
  let old_index = max_index
  current_block = b_number
  max_index = ContractToWorld.max_index(current_block)
  canvas_dimension = ContractToWorld.canvas_dimension(max_index)
  return old_index
}

let resize_canvas = (ctx, new_image_data, old_i) => {
  console.log(`Resizing canvas to: ${canvas_dimension}x${canvas_dimension}...`)
  let new_canvas = new Canvas(canvas_dimension, canvas_dimension) /* ctx keeps a temp reference to old canvas */
  return CanvasUtils.resize_canvas(
    ctx,
    new_canvas,
    { width: canvas_dimension, height: canvas_dimension },
    old_i,
    max_index,
    new_image_data
  ).ctx
}

let resize_buffer = old_i => {
  let new_length = buffer_entry_size * (max_index + 1)
  console.log(`Resizing buffer to: ${new_length}...`)
  address_buffer = Buffer.concat([address_buffer, Buffer.allocUnsafeSlow(buffer_entry_size * (max_index - old_i)).fill(free_pixel_buffer_entry, 'hex')], new_length)
}

let resize_assets = old_i => {
  console.log(`Resizing assets: ${old_i} => ${max_index}...`)
  pixel_buffer_ctx = resize_canvas(pixel_buffer_ctx, new_pixel_image_data, old_i)
  prices_ctx = resize_canvas(prices_ctx, new_pixel_price_data, old_i)
  resize_buffer(old_i)
}

let start_watching = () => {
  let events_filter = instance.allEvents()
  events_filter.stopWatching()
  logs_formatter = events_filter.formatter

  process_past_logs(last_cache_block, current_block)
  
  setInterval(() => {
    fetch_current_block().then(new_block => {
      if (new_block > current_block) {
        let last_processed_block = current_block
        try {
          process_new_block(new_block)
          process_past_logs(last_processed_block + 1, new_block)
          prune_database(last_processed_block)
        }
        catch(e) {
          console.log('Error while processing new block:')
          console.log(e)
          current_block = last_processed_block
        }
      }
      
    })
  }, 10000)
}

let prune_database = until_b_number => {
  console.log(`Pruning database until ${until_b_number}`)
  let blocks_ref = admin.database().ref('blocks')
  blocks_ref.orderByKey().endAt(until_b_number.toString()).once('value').then(snapshot => {
    let updates = {}
    snapshot.forEach(child => {
      updates[child.key] = null
    })
    blocks_ref.update(updates)
  })
}

let process_logs = (b_number, logs) => {
  logs = logs || []
  console.log(`Processing ${logs.length} event${logs.length == 1 ? '' : 's'}`)
  let txs = {}
  logs.forEach(l => {
    let formatted = logs_formatter(l)
    LogUtils.to_sorted_event(txs, formatted)
    if (formatted.event === 'PixelPainted') {
      update_pixel(formatted)
      update_buffer(formatted)
    }
  })
  console.log(`Storing block ${ b_number }`)
  admin.database().ref(`blocks/${b_number}`).set(logs.length ? txs : 0)
  update_cache()
}

let process_past_logs = (start, end) => {
  console.log(`Fetching logs from ${start} to ${end}`)
  provider.sendAsync({
    method: 'eth_getLogs',
    params: [{
      fromBlock: `0x${ start.toString(16) }`,
      toBlock: `0x${ end.toString(16) }`,
      address: instance.address
    }]
  }, (_, response) => process_logs(end, response.result))
}

let reset_cache = (g_block, b_number) => {
  console.log("Resetting cache...")
  admin.database().ref('blocks').set(null)
  max_index = -1
  last_cache_block = g_block
  process_new_block(b_number)
  start_watching()
}

let continue_cache = (b_number, buffer_data, pixels_data, prices_data) => {
  console.log('Using stored cache...')
  /* init the canvas with the last cached image */
  let img = new Canvas.Image()
  img.src = "data:image/png;base64," + Buffer.from(pixels_data).toString('base64')
  console.log(`Last cache dimensions: ${img.width}x${img.height}`)
  let temp_canvas = new Canvas(img.width, img.height)
  pixel_buffer_ctx = temp_canvas.getContext('2d')
  pixel_buffer_ctx.drawImage(img, 0, 0)
  /* init the prices canvas with the last cached image */
  img.src = "data:image/png;base64," + Buffer.from(prices_data).toString('base64')
  temp_canvas = new Canvas(img.width, img.height)
  prices_ctx = temp_canvas.getContext('2d')
  prices_ctx.drawImage(img, 0, 0)
  /* init the buffer with the last cached buffer */
  address_buffer = zlib.inflateRawSync(buffer_data)
  max_index = ContractToWorld.max_index(last_cache_block) /* temp set mat_index to old_index to set old_index to the right value */
  let old_index = store_new_index(b_number)
  resize_assets(old_index)
  start_watching()
}

let fetch_current_block = () => {
  return new Promise((resolve, reject) => {
    provider.sendAsync({
      method: 'eth_blockNumber',
      params: []
      }, (err, res) => {
        if (err)
          reject(err)
        else 
          resolve(parseInt(res.result, 16) - process.env.CONFIRMATIONS_NEEDED)
      }
    )
  })
}

init_provider()
canvasContract.setProvider(provider)
canvasContract.deployed().then(contract_instance => {
  var matching_contract = false
  instance = contract_instance
  console.log(`Contract deployed\nFetching halving information...`)
  instance.HalvingInfo.call().then(halving_info => {
    let g_block = halving_info[0].toNumber()
    ContractToWorld.init(halving_info)
    console.log(`Halving array: ${ halving_info }\nFetching initial data...`)
    fetch_current_block().then(b_number => {
      Promise.all([
        bucket_ref.file(init_file_name).download(),
        bucket_ref.file(buffer_file_name).download(),
        bucket_ref.file(pixels_file_name).download(),
        bucket_ref.file(prices_file_name).download()
      ]).then(([init_data, buffer_data, pixels_data, prices_data]) => {
        init_data = init_data[0]
        buffer_data = buffer_data[0]
        pixels_data = pixels_data[0]
        prices_data = prices_data[0]
        let json_data = JSON.parse(init_data.toString())
        last_cache_block = json_data.last_cache_block
        console.log(`Last block cached: ${ last_cache_block }`)
        let cache_address = json_data.contract_address
        if (cache_address === instance.address)
          continue_cache(b_number, buffer_data, pixels_data, prices_data)
        else {
          console.log('Last cache files point to older contract version, resetting cache...')
          reset_cache(g_block, b_number)
        }
      }).catch(err => {
        console.log(err)
        reset_cache(g_block, b_number)
      })
    })
  })
})

setInterval(() => { let a = 0}, 99999999999)