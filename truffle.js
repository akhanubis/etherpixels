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
      provider: new HDWalletProvider(process.env.ROPSTEN_SEED, "https://ropsten.infura.io/v3/" + process.env.INFURA_API_KEY),
      network_id: 3,
      gas: 4000000 
    },
    mainnet: {
      provider: new HDWalletProvider(process.env.ROPSTEN_SEED, "https://mainnet.infura.io/v3/" + process.env.INFURA_API_KEY),
      network_id: 1,
      gas: 4000000,
      gasPrice: 2000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};