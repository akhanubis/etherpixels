import Web3 from 'web3'

var Infura = (() => {
  var get = () => {
    return new Web3(window.ZeroClientProvider({
              static: {
                eth_syncing: false,
                web3_clientVersion: 'ZeroClientProvider',
              },
              pollingInterval: 99999999, // not interested in polling for new blocks
              rpcUrl: 'https://ropsten.infura.io/koPGObK3IvOlTaqovf2G',
              // account mgmt
              getAccounts: (cb) => cb(null, [])
            }))
  }
  
  return {
    get: get
  }
})()

export default Infura
