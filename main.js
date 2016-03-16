window.onload = function() {
  (function tick(state, time) {
    gfxRender(document.getElementById('canvas'), (time/10)%100)
    window.requestAnimationFrame(tick.bind(null, state))
  })()
}

