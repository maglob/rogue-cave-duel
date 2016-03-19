function gameUpdate(state, dt) {
  state.sprites.forEach(function(s) {
    if (s.playerInput) {
      if (s.playerInput.left)
        s.angle += 4 * dt
      if (s.playerInput.right)
        s.angle -= 4 * dt
      if (s.playerInput.thrust)
        s.pos = s.pos.add(vectorFromAngle(s.angle).mul(100 * dt))
    } else {
      s.pos = s.pos.add(s.v.mul(dt))
      s.angle += s.angleV * dt
      if (s.v.norm() > 0 && (s.pos[0] < -50 || s.pos[0] > 300))
        s.v = s.v.mul(-1)
    }
  })

  return {
    time: state.time + dt,
    cave: state.cave,
    sprites: state.sprites
  }
}

function gameInitialize(playerInput) {
  var meshRock = new Mesh(regularPolygon(8))
  var meshShip = new Mesh([[-5, 9], [20, 0], [-5, -9]])
  var ship = new Sprite(meshShip)
  ship.playerInput = playerInput
  return {
    time: 0,
    cave: [
      [-400, -300], [-300, 0], [-350, 100], [-100, 200], [0, 320], [100, 280], [400, 230], [500, 0], [400, -50],
      [300, 0], [200, -100], [50, -50], [0, -70], [-100, -200], [-150, -300], [-300, -350]
    ],
    sprites: [
      ship,
      new Sprite(
        meshRock.scale(50),
        [-200, 30], [0, 0],
        0, 1
      ),
      new Sprite(
        meshRock.scale(30),
        [-50, 200], [200, 0],
        0, -2
      )
    ]
  }
}

function Sprite(mesh, pos, v, angle, angleV) {
  this.mesh = mesh
  this.pos = pos || [0, 0]
  this.v = v || [0, 0]
  this.angle = angle || 0
  this.angleV = angleV || 0
}

function Mesh(vertices) {
  this.vertices = vertices
}

Mesh.prototype.scale = function(x) {
  return new Mesh(this.vertices.map(function(e) {
    return e.mul(x)
  }))
}