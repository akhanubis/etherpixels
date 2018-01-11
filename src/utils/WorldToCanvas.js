var WorldToCanvas = (() => {
  var to_canvas = (x, y, canvas_size) => {
    return {
      x: Math.floor(x + canvas_size.width / 2),
      y: Math.floor(y + canvas_size.height / 2)
    }
  }
  
  return {
    to_canvas: to_canvas
  }
})()

export default WorldToCanvas