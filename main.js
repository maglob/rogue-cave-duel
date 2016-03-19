window.onload = function() {
  var canvas = document.getElementById('canvas')
  var gc = gfxInitialize(canvas, shaders)
  window.addEventListener('resize', resize)
  resize();

  (function tick(state, time) {
    state = gameUpdate(state, 1/60)
    gc.render(state)
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize())

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    gc.resize(canvas.width, canvas.height)
  }
}

