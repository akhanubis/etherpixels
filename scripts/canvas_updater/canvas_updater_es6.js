import CanvasContract from "../../../build/contracts/Canvas.json"
import Web3 from 'web3'
import ColorUtils from "./utils/ColorUtils.js"
import ContractToWorld from "./utils/ContractToWorld.js"
import WorldToCanvas from "./utils/WorldToCanvas.js"
import CanvasUtils from "./utils/CanvasUtils.js"
const fs = require('fs')
const zlib = require('zlib')
const Canvas = require('canvas')
const ProviderEngine = require('web3-provider-engine')
const ZeroClientProvider = require ('web3-provider-engine/zero.js')
const contract = require('truffle-contract')
const canvasContract = contract(CanvasContract)
 
let owner_canvas = null
let canvas = null
let canvas_dimension = null
let pixel_buffer_ctx = null
let owner_ctx = null
let genesis_block = null
let last_cache_block = null
let current_block = null
let max_index = null
let web3 = null
const file_path = 'public/pixels.png'
const json_file_path = 'public/init.json'

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
      rpcUrl: 'https://ropsten.infura.io/koPGObK3IvOlTaqovf2G',
      getAccounts: (cb) => cb(null, [])
    })
    provider.start()
  }
  return new Web3(provider)
}

let write_file = () => {
  console.log("Updating files...")
  fs.writeFileSync(file_path, canvas.toBuffer(), 'binary')
  fs.writeFileSync(json_file_path, `{ "last_cache_block": ${current_block /* -1 ????? */} }`, 'utf8')
}

let process_new_block = (b_number) => {
  let old_dimension = canvas_dimension
  let old_index = store_new_index(b_number)
  console.log(`New canvas dimensions: ${canvas_dimension}x${canvas_dimension}\nNew canvas index: ${max_index}`)
  resize_canvas(old_index)
}

let process_pixel_solds = (pixel_solds) => {
  console.log(`Processing ${pixel_solds.length} pixels`)
  pixel_solds.forEach((log) => {  
    let world_coords = new ContractToWorld(log.args.i.toNumber()).get_coords()
    let canvas_coords = WorldToCanvas.to_buffer(world_coords.x, world_coords.y, { width: canvas_dimension, height: canvas_dimension })
    let pixel_array = new Uint8ClampedArray(ColorUtils.bytes3ToIntArray(log.args.new_color))
    let image_data = new Canvas.ImageData(pixel_array, 1, 1)
    pixel_buffer_ctx.putImageData(image_data, canvas_coords.x, canvas_coords.y)
    //TODO: mandar email a old_owner
    let owner = log.args.new_owner
    let price = log.args.price
  })
}

let pixel_sold_handler = (error, result) => {
  if (error)
    console.error(error)
  else
    if (result.transactionHash) // event, not log
      result = [result]
    process_pixel_solds(result)
}

let buffer_to_array_buffer = (b) => {
  // TypedArray
  return new Uint32Array(b.buffer, b.byteOffset, b.byteLength / Uint32Array.BYTES_PER_ELEMENT)
}

let store_new_index = (b_number) => {
  let old_index = max_index
  current_block = b_number
  console.log(`Current block:${current_block}`)
  max_index = ContractToWorld.max_index(genesis_block, current_block)
  canvas_dimension = ContractToWorld.canvas_dimension(max_index)
  return old_index
}

let resize_canvas = (old_i) => {
  canvas = new Canvas(canvas_dimension, canvas_dimension) /* pixel_buffer_ctx keeps a temp reference to old canvas */
  CanvasUtils.resize_canvas(
    pixel_buffer_ctx,
    canvas,
    { width: canvas_dimension, height: canvas_dimension },
    old_i,
    max_index,
    Canvas.ImageData,
    (new_ctx) => {
      pixel_buffer_ctx = new_ctx
      write_file()
    }
  )
}

web3 = get_web3()
canvasContract.setProvider(web3.currentProvider)
canvasContract.deployed().then((instance) => {
  console.log(`Contract deployed\nFetching genesis block...`)
  instance.GenesisBlock.call().then((g_block) => {
    genesis_block = g_block
    console.log(`Genesis block: ${ g_block }\nFetching init.json...`)
    fs.readFile(json_file_path, (error, json_data) => {
      if (error) {
        console.log('File init.json not found, setting last_cache_block to genesis_block')
        last_cache_block = g_block
      }
      else {
        last_cache_block = JSON.parse(json_data).last_cache_block
        console.log(`Last block cached: ${ last_cache_block }`)
      }
      console.log('Fetching current block...')
      web3.eth.getBlockNumber((error, b_number) => {
        if (error)
          throw error
        else {
          store_new_index(b_number)
          canvas = new Canvas(canvas_dimension, canvas_dimension)
          pixel_buffer_ctx = canvas.getContext('2d')
          console.log(`Reading ${file_path}...`)
          fs.readFile(file_path, (error, file_data) => {
            if (error) {
              console.log('Last cache file not found')
              resize_canvas(-1)
            }
            else {
              let img = new Canvas.Image
              img.src = file_data
              console.log(`Last canvas dimensions: ${img.width}x${img.height}`)
              let offset = 0.5 * (canvas_dimension - img.width)
              pixel_buffer_ctx.drawImage(img, offset, offset)
              /*
              fs.readFile('public/owners.png', (e2, file_data2) => {
                console.log(file_data2.length)
                let buffer = zlib.deflateSync(file_data2)
                console.log(buffer.length)
                //console.log(buffer_to_array_buffer(file_data2))
                //owner_data = file_data2
              })*/
            } 
            let pixel_sold_event = instance.PixelSold({}, { fromBlock: last_cache_block, toBlock: 'latest' })
            pixel_sold_event.watch(pixel_sold_handler)
            pixel_sold_event.get(pixel_sold_handler)

            web3.eth.filter("latest").watch((error, block_hash) => {
              web3.eth.getBlock(block_hash, (error, result) => {
                if (error)
                  console.error(error)
                else
                  if (result.number > current_block)
                    process_new_block(result.number)
              })
            })

            setInterval(() => { console.log("Listening for events...") }, 60000)
          })
        }
      })
    })
  })
})