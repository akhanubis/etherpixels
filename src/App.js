import React, { Component } from 'react'
import CanvasContract from '../build/contracts/Canvas.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      pixels: null,
      web3: null,
	  min: 0,
	  max: 0,
	  b_thresholds: [],
	  thresholds_length: 0,
	  thresholds_fetched: 0,
	  genesis_block: null
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const canvasContract = contract(CanvasContract)
    canvasContract.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on SimpleStorage.
    var contractInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      canvasContract.deployed().then((instance) => {
		  
        contractInstance = instance

		contractInstance.CurrentBoundaries().watch((error, result) => {
		  if (!error) {
			this.setState({ min: result.args['current_min'].toNumber(), max: result.args['current_max'].toNumber() })
		  }
		})
		
		contractInstance.genesis_block.call().then(g_block => this.setState({ genesis_block: g_block.toNumber() }))
		contractInstance.ThresholdsLength.call().then(thresholds_length => {
			this.setState({ thresholds_length: thresholds_length.toNumber() })
			for(var i = 0; i < this.state.thresholds_length; i++) {
				//closure lol
				(i => {
				  contractInstance.boundaries_thresholds.call(i).then(t_data => {
					const newArray = [...this.state.b_thresholds]
					newArray[i] = { threshold: t_data[0].toNumber(), blocks_per_retarget: t_data[1].toNumber() }
					this.setState({ b_thresholds: newArray, thresholds_fetched: this.state.thresholds_fetched+1 })
				  })
				})(i)
			}
		})
		//this.state.web3.eth.estimateGas({from: accounts[0], to: contractInstance.address, amount: this.state.web3.toWei(1, "ether")}, (result) => { console.log(result)}) TODO VER ESTIMACION DE PAINT Y DEMAS
		
		setInterval(()=> {
        contractInstance.Paint("0", "0", ['0xffffff', '0xff0000', '0x00ff00', '0x0000ff', '0x000000', '0x0f0f0f', '0xf0f0f0'], this.state.web3.fromAscii('pablo'), { from: accounts[0], value: "3000000000", gas: "2000000" })
		}, 10000)
      })
    })
  }
  
  prox_retarget(c_instance) {
	var current_block_since_genesis = this.state.web3.eth.blockNumber - this.state.genesis_block
	var current_threshold = this.state.b_thresholds.findIndex(e => e.threshold > current_block_since_genesis)
	if (current_threshold === -1)
	  return 'inf'
	else {
	  var prev_threshold = current_threshold ? this.state.b_thresholds[current_threshold - 1] : 0
	  var blocks_per_retarget = this.state.b_thresholds[current_threshold].blocks_per_retarget
	  return blocks_per_retarget - ((current_block_since_genesis - prev_threshold) % blocks_per_retarget)
    }
  }
  
  thresholds_fetched() {
	return this.state.thresholds_fetched && this.state.thresholds_fetched === this.state.thresholds_length
  }

  render() {
	let retarget_info = null
	if (this.thresholds_fetched()) {
      retarget_info = ([
		<p>Genesis block: {this.state.genesis_block}</p>,
		<p>Blocknumber: {this.state.web3.eth.blockNumber}</p>,
		<p>Prox retarget en X bloques: {this.prox_retarget(this.state.contractInstance)}</p>
		])
    } else retarget_info = ''
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Good to Go!</h1>
              <p>Your Truffle Box is installed and ready.</p>
              <h2>Smart Contract Example</h2>
              <p>El minimo es: {this.state.min}</p>
			  <p>El maximo es: {this.state.max}</p>
			  {retarget_info}
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App
