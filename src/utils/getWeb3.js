import Web3 from 'web3'
import Infura from './Infura'

let getWeb3 = new Promise(function(resolve, reject) {
  // Wait for loading completion to avoid race conditions with web3 injection timing.
  window.addEventListener('load', function() {
    var results
    var web3 = window.web3
            
    if (process.env.NODE_ENV === 'development') {
      let provider = new Web3.providers.HttpProvider('http://127.0.0.1:9545')
      web3 = new Web3(provider)
          
      results = {
        web3: web3,
        infura: web3
      }
      console.log('Using development web3')
      resolve(results)
    }
    else {
      let infura = Infura.get()
      // Checking if Web3 has been injected by the browser (Mist/MetaMask)
      if (typeof web3 !== 'undefined') {
        // Use Mist/MetaMask's provider.
        web3 = new Web3(web3.currentProvider)

        results = {
          web3: web3,
          infura: infura
        }
        console.log('Using injected web3 + infura')
        resolve(results)
      }
      else {
        results = {
          web3: infura,
          infura: infura
        }
        console.log('Using only Infura')
        resolve(results)
      }
    }
  })
})

export default getWeb3