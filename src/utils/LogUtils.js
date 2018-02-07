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
  
  var mined_tx_index = (pending_txs, tx_info) => {
    let indexes = tx_info.pixels.map(p => p.i)
    return pending_txs.findIndex(pending_tx => {
      /* find the tx that was sent by the same account and referencing the same pixels than the one given */
      return tx_info.owner === pending_tx.caller && indexes.length === pending_tx.pixels.length && indexes.every(i => pending_tx.pixels.find(p => p.index === i))
    })
  }
  
  return {
    to_sorted_event: to_sorted_event,
    mined_tx_index: mined_tx_index
  }
})()

export default LogUtils