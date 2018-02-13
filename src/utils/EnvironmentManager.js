class EnvironmentManager {
  static init(network_id) {
    this.network_id = network_id
  }

  static get(env_var) {
    return process.env[`${env_var}_${this.network_id}`]
  }

  static get_network() {
    return {
      1: 'mainnet',
      3: 'ropsten',
      4447: 'local'
    }[this.network_id]
  }
}

export default EnvironmentManager