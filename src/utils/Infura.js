import Web3 from 'web3'
const ZeroClientProvider = require('./ZeroClientProvider.js')

var Infura = (() => {
  var get = () => {
    return new Web3(ZeroClientProvider({
              static: {
                eth_syncing: false,
                web3_clientVersion: 'ZeroClientProvider',
              },
              pollingInterval: 99999999, // not interested in polling for new blocks
              rpcUrl: `https://${process.env.REACT_APP_INFURA_NETWORK}.infura.io/${ process.env.REACT_APP_INFURA_API_KEY }`,
              // account mgmt
              getAccounts: (cb) => cb(null, [])
    }))
  }
  
  return {
    get: get
  }
})()

export default Infura