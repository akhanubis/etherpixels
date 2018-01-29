var LogUtils = (() => {
  var to_event = log => {
    return {
      i: log.args.i.toNumber(),
      owner: log.args.new_owner,
      color: log.args.new_color,
      locked_until: log.args.locked_until.toNumber(),
      tx: log.transactionHash,
      log_index: log.logIndex
    }
  }
  
  var to_events = logs => {
    return logs.map(l => to_event(l))
  }

  var remaining_txs = (pending_txs, pusher_events) => {
    let events_per_tx = pusher_events.reduce((grouped, e) => {
      grouped[e.tx] = grouped[e.tx] || {}
      grouped[e.tx].indexes = grouped[e.tx].indexes || []
      grouped[e.tx].indexes.push(e.i)
      grouped[e.tx].caller = e.owner
      return grouped
    }, {})
    events_per_tx = Object.keys(events_per_tx).map(key => events_per_tx[key])
    return pending_txs.filter(pending_tx => {
      /* take out the txs that were sent by the same account and referencing the same pixels than one of the pusher txs */
      return !events_per_tx.some(event_tx => {
        return event_tx.caller === pending_tx.caller && event_tx.indexes.length === pending_tx.pixels.length && event_tx.indexes.every(i => pending_tx.pixels.find(p => p.index === i))
      })
    })
  }
  
  return {
    to_events: to_events,
    to_event: to_event,
    remaining_txs: remaining_txs
  }
})()

export default LogUtils