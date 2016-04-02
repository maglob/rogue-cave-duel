function gameUpdate(state, input, config, dt) {
  var collisions = []

  state.rocks.forEach(function (s) {
    s.pos = s.pos.add(s.v.mul(dt))
    s.angle += s.angleV * dt
    if (s.v.norm() > 0 && (s.pos[0] < -50 || s.pos[0] > 300))
      s.v = s.v.mul(-1)
  })

  state.shots.forEach(function (s) {
    var oldPos = s.pos
    s.pos = s.pos.add(s.v.mul(dt))
    var edge = new Edge(oldPos, s.pos)
    if (state.cave.intersects(edge))
      collisions.push({a: null, b: s})
    state.rocks.forEach(function(rock) {
      if (rock.mesh.translate(rock.pos).intersects(edge))
        collisions.push({a: rock, b: s})
    })
  })

  state.ships.forEach(function (s) {
    if (state.cave.intersects(s.mesh.rotate(s.angle).translate(s.pos))) {
      s.angle = Math.PI / 2
      s.pos = [0, 0]
      s.v = [0, 0]
    }
    if (input.fire && (state.time - state.lastShotTime > config.shotDelay)) {
      var shot = new Sprite()
      shot.pos = s.pos.add(vectorFromAngle(s.angle).mul(config.shotStartDistance))
      shot.v = s.v.add(vectorFromAngle(s.angle).mul(config.shotSpeed))
      state.shots.push(shot)
      state.lastShotTime = state.time
    }
    if (input.left)
      s.angle += config.turnSpeed * dt
    if (input.right)
      s.angle -= config.turnSpeed * dt
    if (input.thrust) {
      s.v = s.v.add(vectorFromAngle(s.angle).mul(200 * dt))
      state.thrustParticles.emit(s, 3)
    }
    if (input.debug)
      state.explosions.emit(new Sprite(null, vectorFromAngle(Math.random()*Math.PI*2).mul(30)), 5)
    s.v = s.v.add(config.gravity.mul(dt))
    s.v = s.v.mul(Math.pow(1 - config.friction, dt))
    s.pos = s.pos.add(s.v.mul(dt))
  })

  collisions.forEach(function(col) {
    if (col.a != null)
      col.a.removed = true
    if (col.b != null)
      col.b.removed = true
  })

  return {
    frame: state.frame + 1,
    time: state.time + dt,
    cave: state.cave,
    rocks: state.rocks.filter(function(s) { return !s.removed }),
    ships: state.ships,
    shots: state.shots.filter(function(s) { return !s.removed }),
    thrustParticles: state.thrustParticles.update(dt),
    explosions: state.explosions.update(dt),
    lastShotTime: state.lastShotTime
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
    shots: [],
    thrustParticles: new ParticleSystem(1000, [0, -20], 0.3, .8, Math.PI/2.2, Math.PI, 6, 50),
    explosions: new ParticleSystem(1000, [0,0], 0.8, 0.7, Math.PI*2, 0, 5, 100),
    lastShotTime: 0
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
    if (other instanceof Edge) {
      if (this.edges[i].intersects(other))
        return true
    } else {
      for (var j = 0; j < other.edges.length; j++)
        if (this.edges[i].intersects(other.edges[j]))
          return true
    }
  return false
}

function ParticleSystem(maxCount, gravity, friction, ttl, spread, angle, initialDistance, initialSpeed) {
  this.maxCount = maxCount || 100
  this.gravity = gravity || [0, 0]
  this.friction = friction || 0
  this.ttl = ttl || 1
  this.spread = spread || Math.PI * 2
  this.angle = angle || 0
  this.initialSpeed = initialSpeed || 0
  this.initialDistance = initialDistance || 0
  this.particles = []
}

ParticleSystem.prototype.emit = function (parent, n) {
  n = n || 1
  while (n-- > 0 && this.particles.length < this.maxCount) {
    var s = new Sprite()
    var a = parent.angle + this.angle + Math.random()*this.spread - this.spread/2
    s.pos = parent.pos.add(vectorFromAngle(a).mul(this.initialDistance))
    s.v = parent.v.add(vectorFromAngle(a).mul(this.initialSpeed))
    s.ttl = this.ttl - Math.random()*this.ttl/2
    this.particles.push(s)
  }
}

ParticleSystem.prototype.update = function (dt) {
  var self = this
  this.particles.forEach(function (p) {
    p.ttl -= dt
    p.v = p.v.add(self.gravity.mul(dt))
    p.v = p.v.mul(Math.pow(1 - self.friction, dt))
    p.pos = p.pos.add(p.v.mul(dt))
  })
  this.particles = this.particles.filter(function(p) { return p.ttl > 0 })
  return this
}
