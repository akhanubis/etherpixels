import Alert from 'react-s-alert'
import axios from 'axios'
import * as firebase from 'firebase/app'
import 'firebase/database'

class NameUtils {
  static init() {
    firebase.initializeApp({
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      databaseURL: `https://${process.env.REACT_APP_FIREBASE_APP_NAME}.firebaseio.com`
    })
    firebase.database().ref('usernames').on('value', snapshot => {
      console.log(snapshot.val())
    }, errorObject => {
      console.log("The read failed: " + errorObject.code)
    })
  }

  static submit_name(name, account, provider) {
    if (!(account && name && provider)) return
    let timestamp = new Date().getTime().toString()
    let sign_msg_params = [
      {
        type: 'string',
        name: 'Signing address',
        value: account
      },
      {   
        type: 'string',
        name: 'New name',
        value: name
      },
      {
        type: 'string',
        name: 'Timestamp',
        value: timestamp
      }
    ]   

    provider.sendAsync({
      method: 'eth_signTypedData',
      params: [sign_msg_params, account],
      from: account,
    }, (_, result) => {
      if (result.error)
        return Alert.warning('Message signing failed')
      Alert.info('Submitting new name...')
      axios.post(`https://us-central1-${process.env.REACT_APP_FIREBASE_APP_NAME}.cloudfunctions.net/set_name`, {
        name: name,
        address: account,
        timestamp: timestamp,
        signature: result.result
      })
      .then(_ => Alert.success('Name has been saved'))
      .catch(_ => Alert.error('Name update failed'))
    })
  }
}

export default NameUtils