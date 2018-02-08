import Alert from 'react-s-alert'
import axios from 'axios'

var NameUtils = (() => {
  var submit_name = (name, account, provider) => {
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

  return {
    submit_name: submit_name
  }
})()

export default NameUtils