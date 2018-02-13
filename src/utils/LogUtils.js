var LogUtils = (() => {
  var to_sorted_event = (sorted, log) => {
    sorted[log.transactionHash] = sorted[log.transactionHash] || {
      tx: log.transactionHash,
      owner: log.args.new_owner,
      pixels: []
    }
    sorted[log.transactionHash].pixels.push({
      i: log.args.i.toNumber(),
      color: log.args.new_color,
      locked_until: log.args.locked_until.toNumber(),
      painted: log.event === 'PixelPainted'
    })
  }
  
  var mined_tx = (pending_txs, tx_info) => {
    let indexes = tx_info.pixels.map(p => p.i)
    /* find the tx that was sent referencing the same pixels than the one given */
    return pending_txs.find(pending_tx => pending_tx.owner === tx_info.owner && indexes.length === pending_tx.pixels.length && indexes.every(i => pending_tx.pixels.find(p => p.index === i)))
  }

  return {
    to_sorted_event: to_sorted_event,
    mined_tx: mined_tx
  }
})()

export default LogUtils