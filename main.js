window.onload = function() {
  var gc = gfxInitialize(document.getElementById('canvas'), shaders);
  (function tick(state, time) {
    state = gameUpdate(state, 1/60)
    gc.render(state)
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize())
}

