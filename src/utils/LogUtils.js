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
  
  var to_events = (logs) => {
    return logs.map(l => to_event(l))
  }
  
  return {
    to_events: to_events,
    to_event: to_event
  }
})()

export default LogUtils