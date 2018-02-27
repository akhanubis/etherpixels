import Web3 from 'web3'
const ProviderEngine = require('web3-provider-engine')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js')
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js')

var Infura = (() => {
  var get = () => {
    let provider = new ProviderEngine()
    provider.addProvider(new FixtureSubprovider({
      web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
      net_listening: true,
      eth_hashrate: '0x00',
      eth_mining: false,
      eth_syncing: true,
    }))
    provider.addProvider(new RpcSubprovider({
      rpcUrl: `https://${location.href.includes('ropsten') ? 'ropsten' : 'mainnet'}.infura.io/${process.env.REACT_APP_INFURA_API_KEY}`
    }))
    provider.on('error', err => console.error(err.stack))
    provider.start()
    return new Web3(provider)
  }
  
  return {
    get: get
  }
})()

export default Infura