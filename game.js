function gameUpdate(state, dt) {
  state.sprites.forEach(function(s) {
    s.pos = s.pos.add(s.v.mul(dt))
    s.angle += s.angleV * dt
    if (s.pos[0] < -300 || s.pos[0] > 300)
      s.v = s.v.mul(-1)
  })

  return {
    time: state.time + dt,
    sprites: state.sprites
  }
}

function gameInitialize() {
  var meshOctagon = new Mesh(regularPolygon(8))
  return {
    time: 0,
    sprites: [
      new Sprite(
        meshOctagon.scale(200),
        [0, 0], [100, 0],
        0, 1
      ),
      new Sprite(
        meshOctagon.scale(100),
        [-100, 100], [200, 0],
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