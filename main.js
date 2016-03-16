window.onload = function() {
  (function tick(state, time) {
    state.time = time / 1000
    gfxRender(document.getElementById('canvas'), state)
    window.requestAnimationFrame(tick.bind(null, state))
  })({
    time: 0
  })
}

