import ContractToWorld from './ContractToWorld.js'
import WorldToCanvas from './WorldToCanvas.js'

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

  var resize_canvas = (old_ctx, new_canvas, new_size, old_max_index, new_max_index, image_data_class, callback) => {
    let new_context = new_canvas.getContext('2d')
    new_canvas.width = new_size.width
    new_canvas.height = new_size.height
    let delta_w = 0.5 * (new_size.width - old_ctx.canvas.width)
    let delta_h = 0.5 * (new_size.height - old_ctx.canvas.height)
    clear(new_context, 'rgba(0,0,0,0)', new_size)
    new_context.drawImage(old_ctx.canvas, delta_w, delta_h)
    let i_data = new image_data_class(new Uint8ClampedArray([0, 0, 0, 127]), 1, 1)
    let new_pixels_world_coords = []
    for (var i = old_max_index; i < new_max_index; i++) {
      let world_coords = new ContractToWorld(i + 1).get_coords()
      let buffer_coords = WorldToCanvas.to_buffer(world_coords.x, world_coords.y, new_size)
      new_context.putImageData(i_data, buffer_coords.x, buffer_coords.y)
      new_pixels_world_coords.push(world_coords)
    }
    callback(new_context, new_pixels_world_coords, delta_w, delta_h)
  }
  
  return {
    getContext: getContext,
    clear: clear,
    resize_canvas: resize_canvas
  }
})()

export default CanvasUtils