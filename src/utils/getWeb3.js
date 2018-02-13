import Web3 from 'web3'
import Infura from './Infura'

let getWeb3 = new Promise(function(resolve, reject) {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', function() {
    var web3 = window.web3
            
    // Checking if Web3 has been injected by the browser (Mist/MetaMask)
    if (typeof web3 !== 'undefined') {
      // Use Mist/MetaMask's provider.
      web3 = new Web3(web3.currentProvider)
      console.log('Using injected web3')
      resolve({ web3: web3})
    }
    else {
      let infura = Infura.get()
      console.log('Using only Infura')
      resolve({ web3: infura, watch_only: true})
    }
  })
})

export default getWeb3