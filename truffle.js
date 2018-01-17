var HDWalletProvider = require("truffle-hdwallet-provider");

require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: new HDWalletProvider(process.env.REACT_APP_ROPSTEN_SEED, "https://ropsten.infura.io/" + process.env.REACT_APP_INFURA_API_KEY),
      network_id: 3,
      gas: 3000000 
    }
  }
};