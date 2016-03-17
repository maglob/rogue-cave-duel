window.onload = function() {
  gfxInitialize(document.getElementById('canvas'), shaders);
  (function tick(state, time) {
    state.time = time / 1000
    gfxRender(state)
    window.requestAnimationFrame(tick.bind(null, state))
  })({
    time: 0
  })
}

