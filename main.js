window.onload = function() {
  var canvas = document.getElementById('canvas')
  var gc = gfxInitialize(canvas, shaders)
  var input = {
    left: false,
    right: false,
    thrust: false
  }
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', readkeys.bind(input, true))
  window.addEventListener('keyup', readkeys.bind(input, false))
  resize();

  (function tick(state, time) {
    state = gameUpdate(state, 1/60)
    gc.render(state)
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize(input))

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    gc.resize(canvas.width, canvas.height)
  }

  function readkeys(isDown, e) {
    switch (e.keyCode) {
      case 65: this.left = isDown; break;
      case 68: this.right = isDown; break;
      case 87: this.thrust = isDown; break;
    }
  }
}

