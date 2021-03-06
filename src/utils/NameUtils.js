import Alert from 'react-s-alert'
import axios from 'axios'
import EnvironmentManager from './EnvironmentManager'

class NameUtils {
  static init(firebase) {
    return new Promise(resolve => {
      let stored_usernames = localStorage.getItem('usernames')
      this.index = stored_usernames ? JSON.parse(stored_usernames) : {}

      let ref = firebase.database().ref('usernames')
      ref.startAt(localStorage.getItem('last_modified_fetched') || 0).once('value').then(snapshot => {
        Object.entries(snapshot.val() || {}).forEach(data => this.add_to_db(data[0], data[1]))
        let update_ref = ref.orderByChild('last_modified').limitToLast(1)
        update_ref.on('child_added', this.handle_new_name.bind(this))
        update_ref.on('child_changed', this.handle_new_name.bind(this))
        resolve()
      })
    })
  }

  static submit_name(name, account, provider, callback) {
    name = name.trim()
    if (!(account && provider)) return
    let timestamp = new Date().getTime().toString()
    let sign_msg_params = [
      {
        type: 'string',
        name: 'Signing address',
        value: account
      },
      {
        type: 'string',
        name: 'Timestamp',
        value: timestamp
      }
    ]
    if (name)
      sign_msg_params.push({
        type: 'string',
        name: 'Action',
        value: 'Set name'
      },
      {
        type: 'string',
        name: 'New name',
        value: name
      })
    else
      sign_msg_params.push({
        type: 'string',
        name: 'Action',
        value: 'Clear name'
      })

    provider.sendAsync({
      method: 'eth_signTypedData',
      params: [sign_msg_params, account],
      from: account,
    }, (_, result) => {
      if (result.error)
        return Alert.warning('Message signing failed')
      Alert.info('Submitting new name...')
      axios.post(`https://us-central1-${EnvironmentManager.get('REACT_APP_FIREBASE_APP_NAME')}.cloudfunctions.net/set_name`, {
        name: name,
        address: account,
        timestamp: timestamp,
        signature: result.result
      })
      .then(_ => {
        Alert.success('Name has been saved')
        callback()
      })
      .catch(_ => Alert.error('Name update failed'))
    })
  }

  static handle_new_name(snapshot) {
    this.add_to_db(snapshot.key, snapshot.val())
  }

  static name(address) {
    if (this.index)
      return this.index[address] || address
    else
      return address
  }

  static add_to_db(address, { name, last_modified }) {
    this.index[address] = name
    localStorage.setItem('usernames', JSON.stringify(this.index))
    localStorage.setItem('last_modified_fetched', last_modified)
  }
}

export default NameUtils