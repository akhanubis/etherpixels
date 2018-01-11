var CanvasUtils = (() => {
  var getContext = (canvas, aliasing) => {
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = aliasing
    ctx.mozImageSmoothingEnabled = aliasing
    ctx.webkitImageSmoothingEnabled = aliasing
    ctx.msImageSmoothingEnabled = aliasing
    return ctx
  }
  
  var clear = (ctx, color, canvas_size) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas_size.width, canvas_size.height)
  }
  
  return {
    getContext: getContext,
    clear: clear
  }
})()

export default CanvasUtils