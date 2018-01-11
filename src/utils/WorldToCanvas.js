var WorldToCanvas = (() => {
  var to_canvas = (x, y, canvas_size) => {
    return {
      x: Math.floor(x + 0.5 * canvas_size.width),
      y: Math.floor(0.5 * canvas_size.height - y)
    }
  }
  
  return {
    to_canvas: to_canvas
  }
})()

export default WorldToCanvas