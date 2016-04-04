function gameUpdate(state, input, config, dt) {
  state.rocks.forEach(function (s) {
    s.pos = s.pos.add(s.v.mul(dt))
    s.angle += s.angleV * dt
    if (s.v.norm() > 0 && (s.pos[0] < -50 || s.pos[0] > 300))
      s.v = s.v.mul(-1)
  })

  state.shots.forEach(function (s) {
    s.oldPos = s.pos
    s.pos = s.pos.add(s.v.mul(dt))
    s.ttl -= dt
  })

  state.ships.forEach(function (s) {
    if (input.fire && (state.time - state.lastShotTime > config.shotDelay)) {
      var shot = new Sprite()
      shot.ttl = config.shotTtl
      shot.unitV = vectorFromAngle(s.angle)
      shot.pos = s.pos.add(shot.unitV.mul(config.shotStartDistance))
      shot.v = s.v.add(shot.unitV.mul(config.shotSpeed))
      state.shots.push(shot)
      state.lastShotTime = state.time
    }
    if (input.left)
      s.angle += config.turnSpeed * dt
    if (input.right)
      s.angle -= config.turnSpeed * dt
    if (input.thrust) {
      s.v = s.v.add(vectorFromAngle(s.angle).mul(200 * dt))
      state.thrustParticles.emit(3, s)
    }
    s.v = s.v.add(config.gravity.mul(dt))
    s.v = s.v.mul(Math.pow(1 - config.friction, dt))
    s.pos = s.pos.add(s.v.mul(dt))
  })

  detectCollisions().forEach(function(pair) {
    pair.forEach(function(s) {
      if (s) {
        s.ttl = -1
        if (s.mesh)
          state.explosions.emit(30, new Sprite(null, s.pos))
      }
      if (state.ships.indexOf(s) >= 0) {
        s.angle = Math.PI / 2
        s.pos = [0, 0]
        s.v = [0, 0]
      }
    })
  })

  return {
    frame: state.frame + 1,
    time: state.time + dt,
    cave: state.cave,
    rocks: state.rocks.filter(function(s) { return s.ttl >= 0 }),
    ships: state.ships,
    shots: state.shots.filter(function(s) { return s.ttl >= 0 }),
    thrustParticles: state.thrustParticles.update(dt),
    explosions: state.explosions.update(dt),
    lastShotTime: state.lastShotTime
  }

  function detectCollisions() {
    var collisions = []
    state.shots.forEach(function (s) {
      if (s.oldPos) {
        var edge = new Edge(s.oldPos, s.pos)
        if (state.cave.intersects(edge))
          collisions.push([null, s])
        state.rocks.forEach(function (rock) {
          if (rock.mesh.translate(rock.pos).intersects(edge))
            collisions.push([rock, s])
        })
      }
    })
    state.ships.forEach(function (s) {
      if (state.cave.intersects(s.mesh.rotate(s.angle).translate(s.pos))) {
        collisions.push([null, s])
      }
    })
    return collisions
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
    thrustParticles: new ParticleSystem(1000, [0, -20], 0.3, genUniform(.4, .8), genUniform(Math.PI-Math.PI/4.4, Math.PI+Math.PI/4.4), 6, 50),
    explosions: new ParticleSystem(1000, [0,0], 0.95, genUniform(0.35, 0.7), genUniform(0, Math.PI*2), genUniform(0, 30), 100),
    lastShotTime: 0
  }
}

function Sprite(mesh, pos, v, angle, angleV) {
  this.mesh = mesh
  this.pos = pos || [0, 0]
  this.v = v || [0, 0]
  this.angle = angle || 0
  this.angleV = angleV || 0
  this.ttl = 0
}

function Mesh(vertices) {
  this.vertices = vertices
  this.edges = range(vertices.length).map(function(i) {
    return new Edge(vertices[i], vertices[(i+1) % vertices.length])
  })
}

Mesh.prototype.triangles = function() {
  var res = []
  var vert = this.vertices.slice()

  range(vert.length - 3).forEach(function () {
    var v = range(vert.length).filter(isConvex).reduce(function (a, b) {
      return vertexDot(a) > vertexDot(b) ? a : b
    })
    res.push(triangle(v))
    vert.splice(v, 1)
  })

  return res.concat([triangle(1)])

  function triangle(i) {
    return [prevVertex(i), vert[i], nextVertex(i)]
  }

  function isConvex(i) {
    var a = prevVertex(i)
    var b = vert[i]
    var c = nextVertex(i)
    return (a[0]*b[1] - b[0]*a[1]) + (b[0]*c[1] - c[0]*b[1]) + (c[0]*a[1] - c[1]*a[0]) < 0
  }

  function vertexDot(i) {
    return prevVertex(i).sub(vert[i]).unit().dot(nextVertex(i).sub(vert[i]).unit())
  }
  function nextVertex(i) { return vert[(i + 1) % vert.length] }
  function prevVertex(i) { return vert[(vert.length + i - 1) % vert.length] }
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

function ParticleSystem(maxCount, gravity, friction, ttl, angle, distance, speed) {
  this.maxCount = maxCount || 100
  this.gravity = gravity || [0, 0]
  this.friction = friction || 0
  this.ttl = wrap(ttl)
  this.angle = wrap(angle)
  this.distance = wrap(distance)
  this.speed = wrap(speed)
  this.particles = []

  function wrap(val) {
    return typeof val === 'function' ? val : function() { return val }
  }
}

ParticleSystem.prototype.emit = function (n, parent) {
  n = n || 1
  parent = parent || new Sprite()
  while (n-- > 0 && this.particles.length < this.maxCount) {
    var s = new Sprite()
    var a = parent.angle + this.angle()
    s.pos = parent.pos.add(vectorFromAngle(a).mul(this.distance()))
    s.v = parent.v.add(vectorFromAngle(a).mul(this.speed()))
    s.ttl = this.ttl()
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
