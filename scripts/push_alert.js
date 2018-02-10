/* heroku usage: heroku run --app app "npm run send_server_message -- --type=type 'message with spaces'" */
require('dotenv').config({silent: true})
const Pusher = require('pusher')
let pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
  encrypted: true
})

let default_args = {
  channel: 'main',
  event: 'server_message',
  type: 'info'
}

let { channel, event, type, _ } = { ...default_args, ...require('minimist')(process.argv.slice(2)) }
pusher.trigger(channel, event, { type, message: _[0] })