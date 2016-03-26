window.onload = function() {
  var config = {
    gravity: [0, -30],
    friction: 0.1,
    turnSpeed: 4,
    caveColor: [.7, .7, 0, 1],
    shipColor: [1, 1, 1, 1],
    rockColor: [1, 0, 0, 1],
    backgroundColor: [.1, .1, .1, 1],
    vertexBufferSize: 8192
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

  resize()
  var pause = false
  var prevTime = 0
  var avgFrameTime = 1 / 60 * 1000;

  (function tick(state, time) {
    if (prevTime)
      avgFrameTime = avgFrameTime * .8 + (time - prevTime) * .2
    prevTime = time
    if (input.pauseToggle) {
      pause = !pause
      input.pauseToggle = false
    }
    if (!pause) {
      state = gameUpdate(state, input, config, 1 / 60)
      gc.render(state)
      document.getElementById('fps').textContent = (1 / avgFrameTime * 1000).toFixed()
    }
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize())

  function resize() {
    gc.resize(window.innerWidth, window.innerHeight)
  }

  function readkeys(isDown, e) {
    switch (e.keyCode) {
      case 65: this.left = isDown; break;
      case 68: this.right = isDown; break;
      case 16:
      case 87: this.thrust = isDown; break;
      case 32: this.pauseToggle = isDown; break;
    }
  }
}

