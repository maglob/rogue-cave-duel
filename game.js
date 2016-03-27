function gameUpdate(state, input, config, dt) {
  state.rocks.forEach(function (s) {
    s.pos = s.pos.add(s.v.mul(dt))
    s.angle += s.angleV * dt
    if (s.v.norm() > 0 && (s.pos[0] < -50 || s.pos[0] > 300))
      s.v = s.v.mul(-1)
  })

  state.shots.forEach(function (s) {
    s.pos = s.pos.add(s.v.mul(dt))
  })

  state.ships.forEach(function (s) {
    if (state.cave.intersects(s.mesh.rotate(s.angle).translate(s.pos))) {
      s.angle = Math.PI / 2
      s.pos = [0, 0]
      s.v = [0, 0]
    }
    if (input.fire) {
      var shot = new Sprite()
      shot.pos = s.pos.add(vectorFromAngle(s.angle).mul(config.shotStartDistance))
      shot.v = s.v.add(vectorFromAngle(s.angle).mul(config.shotSpeed))
      state.shots.push(shot)
    }
    if (input.left)
      s.angle += config.turnSpeed * dt
    if (input.right)
      s.angle -= config.turnSpeed * dt
    if (input.thrust)
      s.v = s.v.add(vectorFromAngle(s.angle).mul(200 * dt))
    s.v = s.v.add(config.gravity.mul(dt))
    s.v = s.v.mul(Math.pow(1 - config.friction, dt))
    s.pos = s.pos.add(s.v.mul(dt))
  })

  return {
    frame: state.frame + 1,
    time: state.time + dt,
    cave: state.cave,
    rocks: state.rocks,
    ships: state.ships,
    shots: state.shots
  }
}

function gameInitialize() {
  var meshRock = new Mesh(regularPolygon(8))
  var meshShip = new Mesh([[-7, 10], [18, 0], [-7, -10], [-2, -4], [-2, 4]])
  var ship = new Sprite(meshShip, [0, 0], [0, 0], Math.PI/2)

  return {
    frame: 0,
    time: 0,
    cave: new Mesh(bezierPath([
      [-400, -300], [-300, 0], [-350, 100], [-100, 200], [0, 320], [100, 280], [400, 230], [500, 0], [400, -50],
      [300, 0], [200, -100], [50, -50], [0, -70], [-100, -200], [-150, -300], [-300, -350]
    ], 8)),
    ships: [ship],
    rocks: [
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
    ],
    shots: []
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
  this.edges = range(vertices.length).map(function(i) {
    return new Edge(vertices[i], vertices[(i+1) % vertices.length])
  })
}

Mesh.prototype.scale = function(x) {
  return new Mesh(this.vertices.map(function(e) {
    return e.mul(x)
  }))
}

Mesh.prototype.translate = function(v) {
  return new Mesh(this.vertices.map(function(e) {
    return e.add(v)
  }))
}

Mesh.prototype.rotate = function(a) {
  return new Mesh(this.vertices.map(function(e) {
    return e.rotate(a)
  }))
}

Mesh.prototype.intersects = function(other) {
  for(var i=0; i<this.edges.length; i++)
    for(var j=0; j<other.edges.length; j++)
      if (this.edges[i].intersects(other.edges[j]))
        return true
  return false
}