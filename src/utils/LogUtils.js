var LogUtils = (() => {
  var to_sorted_event = (sorted, log) => {
    sorted[log.transactionHash] = sorted[log.transactionHash] || {
      tx: log.transactionHash,
      owner: log.args.new_owner,
      locked_until: log.args.locked_until.toNumber(),
      pixels: []
    }
    sorted[log.transactionHash].pixels.push({
      i: log.args.i.toNumber(),
      color: log.args.new_color
    })
  }
  
  var remaining_txs = (pending_txs, tx_info) => {
    let indexes = tx_info.pixels.map(p => p.i)
    return pending_txs.filter(pending_tx => {
      /* take out the tx that was sent by the same account and referencing the same pixels than the one given */
      return !(tx_info.owner === pending_tx.caller && indexes.length === pending_tx.pixels.length && indexes.every(i => pending_tx.pixels.find(p => p.index === i))) 
    })
  }
  
  return {
    to_sorted_event: to_sorted_event,
    remaining_txs: remaining_txs
  }
})()

export default LogUtils