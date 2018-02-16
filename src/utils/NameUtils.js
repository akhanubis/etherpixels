import Alert from 'react-s-alert'
import axios from 'axios'
import * as firebase from 'firebase/app'
import 'firebase/database'
import EnvironmentManager from './EnvironmentManager'

class NameUtils {
  static init() {
    return new Promise(resolve => {
      firebase.initializeApp({
        apiKey: EnvironmentManager.get('REACT_APP_FIREBASE_API_KEY'),
        databaseURL: `https://${EnvironmentManager.get('REACT_APP_FIREBASE_APP_NAME')}.firebaseio.com`
      })
      let stored_usernames = localStorage.getItem('usernames')
      this.index = stored_usernames ? JSON.parse(stored_usernames) : {}

      let ref = firebase.database().ref('usernames')
      ref.startAt(localStorage.getItem('last_modified_fetched') || 0).once('value').then(snapshot => {
        Object.entries(snapshot.val() || {}).forEach(data => this.add_to_db(data[0], data[1]))
        let update_ref = ref.orderByChild('last_modified').limitToLast(1)
        update_ref.on('child_added', this.handle_new_name.bind(this))
        update_ref.on('child_changed', this.handle_new_name.bind(this))
        this.after_init()
        resolve()
      })
    })
  }

  static set_after_init(fn) {
    this.after_init = fn
  }
  
  static submit_name(name, account, provider) {
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
      .then(_ => Alert.success('Name has been saved'))
      .catch(_ => Alert.error('Name update failed'))
    })
  }

  static handle_new_name(snapshot) {
    this.add_to_db(snapshot.key, snapshot.val())
  }

  static name(address) {
    return this.index[address] || address
  }

  static add_to_db(address, { name, last_modified }) {
    this.index[address] = name
    localStorage.setItem('usernames', JSON.stringify(this.index))
    localStorage.setItem('last_modified_fetched', last_modified)
  }
}

export default NameUtils