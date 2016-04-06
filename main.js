window.onload = function() {
  var config = {
    gravity: [0, -30],
    friction: 0.1,
    turnSpeed: 4,
    caveColor: [.7, .7, 0, 1],
    caveBackgroundColor: [0, 0, 0, 1],
    shipColor: [1, 1, 1, 1],
    rockColor: [1, 0, 0, 1],
    backgroundColor: [.3, .1, .1, 1],
    shotColor: [.7, .7, 1, 1],
    shotTrailColor: [.4, .4,.8, 1],
    thrustColor: [.25, .3, .1, 1],
    explosionColor: [.2, .4, .05, 1],
    shotSpeed: 200,
    shotStartDistance: 20,
    shotTtl: 4,
    shotDelay: 0.3,
    vertexBufferSize: 8192
  }
  var gc = gfxInitialize(document.getElementById('canvas'), shaders, config)
  var input = {
    left: false,
    right: false,
    thrust: false,
    up: false,
    down: false,
    pause: false,
    mousePos: [0, 0],
    editMode: false
  }
  window.addEventListener('resize', resize)
  window.addEventListener('keydown', readkeys.bind(input, true))
  window.addEventListener('keyup', readkeys.bind(input, false))
  window.addEventListener('mousemove', function(e) {
    input.mousePos = [e.clientX, e.clientY]
  })

  resize()
  var prevTime = 0
  var avgFrameTime = 1 / 60 * 1000;

  (function tick(state, time) {
    if (prevTime)
      avgFrameTime = avgFrameTime * .8 + (time - prevTime) * .2
    prevTime = time
    state.mode = input.editMode ? Mode.EDIT : Mode.GAME
    if (state.mode == Mode.EDIT) {
      if (input.up)
        state.offset = state.offset.add([0, 8])
      if (input.down)
        state.offset = state.offset.add([0, -8])
      if (input.right)
        state.offset = state.offset.add([8, 0])
      if (input.left)
        state.offset = state.offset.add([-8, 0])
    }
    if (!input.pause && state.mode == Mode.GAME)
      state = gc.render(gameUpdate(state, input, config, 1 / 60))
    else if (state.mode == Mode.EDIT)
      gc.render(state)
    var pos = viewToWorld(input.mousePos, state.offset, gc.getSize())
    document.getElementById('fps').textContent =
      (1 / avgFrameTime * 1000).toFixed() + " (" +
      pos[0].toFixed() + ", " +
      pos[1].toFixed() + ")"
    window.requestAnimationFrame(tick.bind(null, state))
  })(gameInitialize())

  function viewToWorld(v, offset, viewSize) {
    v = [v[0], -v[1]]
    return v.add(offset).sub([viewSize[0]/2, -viewSize[1]/2])
  }

  function resize() {
    gc.resize(window.innerWidth, window.innerHeight)
  }

  function readkeys(isDown, e) {
    var preventDefault = true
    switch (e.keyCode) {
      case 13: this.fire = isDown; break;
      case 83: this.down = this.fire = isDown; break;
      case 65: this.left = isDown; break;
      case 68: this.right = isDown; break;
      case 16: this.thrust = isDown; break;
      case 87: this.up = this.thrust = isDown; break;
      case 32:
        if (!isDown)
          this.pause = !this.pause
        break;
      case 49:
        if (!isDown)
          this.editMode = false;
        break;
      case 50:
        if (!isDown)
          this.editMode = true;
        break;
      case 70:
        var el = document.getElementById('game')
        var fullscreen = el.requestFullScreen || el.mozRequestFullScreen || el.webkitRequestFullScreen
        fullscreen.call(el)
        break;
      default: preventDefault = false; break;
    }
    if(preventDefault)
      e.preventDefault()
  }
}

