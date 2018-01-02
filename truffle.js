var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider("velvet orange exhibit phone train sphere actor gloom liar student engage act", "https://ropsten.infura.io/koPGObK3IvOlTaqovf2G"),
      network_id: 3,
      gas: 3000000 
    }
  }
};