import CanvasContract from "../../../build/contracts/Canvas.json"
import Web3 from 'web3'
const ProviderEngine = require('web3-provider-engine')
const ZeroClientProvider = require ('web3-provider-engine/zero.js')
 
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
      // account mgmt
      getAccounts: (cb) => cb(null, [])
    })
    provider.start()
  }
  return new Web3(provider)
}

let process_pixel_solds = (pixel_solds) => {
  console.log(pixel_solds)
}

let pixel_sold_handler = (error, result) => {
  if (error)
    console.error(error)
  else
    if (result.transactionHash) // event, not log
      result = [result]
    process_pixel_solds(result)
}

let web3 = get_web3()
const contract = require('truffle-contract')
const canvasContract = contract(CanvasContract)
canvasContract.setProvider(web3.currentProvider)
canvasContract.deployed().then((instance) => {
  instance.CurrentBoundaries().watch((error, result) => {
    if (error)
      console.error(error)
    else {
      console.log("CURRENT BOUNDARIES")
      console.log({ min: result.args['current_min'].toNumber(), max: result.args['current_max'].toNumber() })
    }
  })
  let pixel_sold_event = instance.PixelSold(null, { fromBlock: /*this.last_cache_block*/0, toBlock: 'latest' })
  pixel_sold_event.watch(pixel_sold_handler)
  pixel_sold_event.get(pixel_sold_handler)

  setInterval(() => { console.log("Listening for events...") }, 60000)
})