window.onload = function() {
  gfxInitialize(document.getElementById('canvas'), shaders);
  (function tick(state, time) {
    state = gameUpdate(state, 1/60)
    gfxRender(state)
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize())
}

