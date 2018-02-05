var LogUtils = (() => {
  var to_sorted_event = (sorted, log) => {
    sorted[log.transactionHash] = sorted[log.transactionHash] || []
    sorted[log.transactionHash].push({
      i: log.args.i.toNumber(),
      owner: log.args.new_owner,
      color: log.args.new_color,
      locked_until: log.args.locked_until.toNumber(),
      tx: log.transactionHash
    })
  }
  
  var remaining_txs = (pending_txs, pusher_events) => {
    let indexes = pusher_events.map(e => e.i)
    return pending_txs.filter(pending_tx => {
      /* take out the tx that was sent by the same account and referencing the same pixels than the one given */
      return !(pusher_events[0].owner === pending_tx.caller && indexes.length === pending_tx.pixels.length && indexes.every(i => pending_tx.pixels.find(p => p.index === i))) 
    })
  }
  
  return {
    to_sorted_event: to_sorted_event,
    remaining_txs: remaining_txs
  }
})()

export default LogUtils