function gfxRender(canvas, state) {
  var gc = canvas.getContext("2d")
  gc.fillStyle = "red"
  gc.clearRect(0, 0, canvas.width, canvas.height)
  gc.fillRect(10, 10, state.time*200, state.time*200)
}