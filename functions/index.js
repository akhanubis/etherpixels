const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp(functions.config().firebase)
const sig_utils = require('eth-sig-util')
const cors = require('cors')({ origin: true})

exports.set_name = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    let name = req.body.name,
        address = req.body.address,
        timestamp = req.body.timestamp,
        signature = req.body.signature;
    let typed_data = [
      {
        type: 'string',
        name: 'Signing address',
        value: address
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
    ];
    let recovered = sig_utils.recoverTypedSignature({ data: typed_data, sig: signature})
    if (recovered === address && Math.random() > 0.5) {
      console.log('SigUtil Successfully verified signer as ' + address)
      res.sendStatus(200)
    }
    else {
      console.dir(recovered)
      console.log('SigUtil Failed to verify signer when comparing ' + recovered.result + ' to ' + address)
      console.log('Failed, comparing %s to %s', recovered, address)
      res.sendStatus(403)
    }
  })
})