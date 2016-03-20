window.onload = function() {
  var config = {
    caveColor: [1, 1, 0, 1],
    shipColor: [1, 1, 1, 1],
    rockColor: [1, 0, 0, 1],
    backgroundColor: [.1, .1, .1, 1]
  }
  var gc = gfxInitialize(document.getElementById('canvas'), shaders, config)
  var input = {
    left: false,
    right: false,
    thrust: false,
    pauseToggle: false
  }
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', readkeys.bind(input, true))
  window.addEventListener('keyup', readkeys.bind(input, false))

  resize();
  var pause = false;

  (function tick(state, time) {
    if (input.pauseToggle) {
      pause = !pause
      input.pauseToggle = false
    }
    if (!pause) {
      state = gameUpdate(state, 1 / 60)
      gc.render(state)
    }
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize(input))

  function resize() {
    gc.resize(window.innerWidth, window.innerHeight)
  }

  function readkeys(isDown, e) {
    switch (e.keyCode) {
      case 65: this.left = isDown; break;
      case 68: this.right = isDown; break;
      case 87: this.thrust = isDown; break;
      case 32: this.pauseToggle = isDown; break;
    }
  }
}

