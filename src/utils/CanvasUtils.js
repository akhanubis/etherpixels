import ContractToWorld from './ContractToWorld.js'
import WorldToCanvas from './WorldToCanvas.js'

var CanvasUtils = (() => {
  /* so I cant do new ImageData... on CanvasUtils definition time because the script doesnt know about ImageData :/ */
  var cached_transparent_image_data = null

  var transparent_image_data = (image_data_class) => {
    cached_transparent_image_data = cached_transparent_image_data || new image_data_class(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1)
    return cached_transparent_image_data
  }

  var cached_semitrans_image_data = null
  var semitrans_image_data = (image_data_class) => {
    cached_semitrans_image_data = cached_semitrans_image_data || new image_data_class(new Uint8ClampedArray([0, 0, 0, 127]), 1, 1)
    return cached_semitrans_image_data
  }

  var getContext = (canvas, aliasing) => {
    let ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = aliasing
    ctx.mozImageSmoothingEnabled = aliasing
    ctx.webkitImageSmoothingEnabled = aliasing
    ctx.msImageSmoothingEnabled = aliasing
    return ctx
  }
  
  var clear = (ctx, color) => {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }

  var new_canvas = (dimension, must_clear) => {
    let canvas = document.createElement('canvas')
    canvas.width = dimension
    canvas.height = dimension
    let ctx = canvas.getContext('2d')
    if (must_clear)
      clear(ctx, 'rgba(0, 0, 0, 0)')
    return ctx
  }

  var resize_secondary_canvas = (old_ctx, dimension) => {
    let new_ctx = new_canvas(dimension, true)
    let offset = 0.5 * (dimension - old_ctx.canvas.width)
    new_ctx.drawImage(old_ctx.canvas, offset, offset)
    return new_ctx
  }

  var resize_canvas = (old_ctx, new_canvas, new_size, old_max_index, new_max_index, i_data_for_new_pixel, callback) => {
    var offset_w, offset_h
    let new_context = new_canvas.getContext('2d')
    new_canvas.width = new_size.width
    new_canvas.height = new_size.height
    clear(new_context, 'rgba(0,0,0,0)')
    if (old_ctx) {
      offset_w = 0.5 * (new_size.width - old_ctx.canvas.width)
      offset_h = 0.5 * (new_size.height - old_ctx.canvas.height)
      new_context.drawImage(old_ctx.canvas, offset_w, offset_h)
    }
    let new_pixels_world_coords = []
    for (var i = old_max_index; i < new_max_index; i++) {
      let world_coords = new ContractToWorld(i + 1).get_coords()
      let buffer_coords = WorldToCanvas.to_buffer(world_coords.x, world_coords.y, new_size)
      new_context.putImageData(i_data_for_new_pixel, buffer_coords.x, buffer_coords.y)
      new_pixels_world_coords.push(world_coords)
    }
    if (callback)
      callback(new_context, new_pixels_world_coords, offset_w, offset_h)
    else
      return new_context
  }

  return {
    getContext: getContext,
    clear: clear,
    resize_canvas: resize_canvas,
    transparent_image_data: transparent_image_data,
    semitrans_image_data: semitrans_image_data,
    new_canvas: new_canvas,
    resize_secondary_canvas: resize_secondary_canvas
  }
})()

export default CanvasUtils