function gfxRender(canvas, state) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  if (!state.gfxIsInitialized) {
    initialize()
    state.gfxIsInitialized = true
  }

  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  function initialize() {
    console.log("*** gfx init", gl)
  }
}

