var WorldToCanvas = (() => {
  var to_buffer = (x, y, buffer_size) => {
    return {
      x: Math.floor(x + 0.5 * buffer_size.width),
      y: Math.floor(0.5 * buffer_size.height - y)
    }
  }

  var to_viewport = (world_coords, buffer_size, buffer_coords_at_viewport_center, buffer_pixel_in_viewport_size, viewport_size) => {
    /* current_wheel_zoom happens to be the same as the canvas sixe of a pixel */
    /* simplified from (world_coords.x - buffer_coords_at_viewport_center.x + 0.5 * buffer_size.width) * buffer_pixel_in_viewport_size + viewport_size.width * 0.5 - buffer_pixel_in_viewport_size * 0.5 */
    return {
      x: (0.5 * (buffer_size.width - 1) + world_coords.x - buffer_coords_at_viewport_center.x) * buffer_pixel_in_viewport_size + viewport_size.width * 0.5,
      y: (0.5 * (buffer_size.height - 1) - world_coords.y - buffer_coords_at_viewport_center.y) * buffer_pixel_in_viewport_size + viewport_size.height * 0.5
    }
  }
  
  return {
    to_buffer: to_buffer,
    to_viewport: to_viewport
  }
})()

export default WorldToCanvas