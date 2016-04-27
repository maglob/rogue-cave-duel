Mode = {
  ATTRACT: 1,
  GAME: 2,
  EDIT: 3
}

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

  state.debris.forEach(function (s) {
    s.v = s.v.add(config.gravity.mul(dt))
    s.v = s.v.mul(Math.pow(1 - config.friction, dt))
    s.pos = s.pos.add(s.v.mul(dt))
    s.angle += s.angleV * dt
    s.ttl -= dt
  })

  state.ships.forEach(function (s) {
    s.update(state, input, config, dt)
    s.v = s.v.add(config.gravity.mul(dt))
    s.v = s.v.mul(Math.pow(1 - config.friction, dt))
    s.pos = s.pos.add(s.v.mul(dt))
  })

  detectCollisions().forEach(function(pair) {
    pair.forEach(function(s) {
      if (s) {
        s.ttl = -1
        if (s.mesh) {
          state.explosions.emit(30, new Sprite(null, s.pos))
          state.shards.emit(100, new Sprite(null, s.pos))
          s.mesh.edges.forEach(function(e) {
            var mp = e.a.add(e.vector.mul(genUniform(.1,.9)()))
            var debris = new Sprite(new Mesh([e.a.sub(mp), e.b.sub(mp)]), s.pos.add(mp))
            debris.v = vectorFromAngle(genUniform(0,Math.PI*2)()).mul(genUniform(50, 100)())
            debris.angle = s.angle
            debris.angleV = genUniform(1, 6)()
            debris.ttl = genUniform(.5, 3)()
            state.debris.push(debris)
          })
        } else {
          state.smallShards.emit(10, new Sprite(null, s.pos))
        }
      }
      if (state.ships.indexOf(s) >= 0) {
        s.angle = Math.PI / 2
        s.pos = [0, 0]
        s.v = [0, 0]
      }
    })
  })

  return {
    mode: state.mode,
    frame: state.frame + 1,
    time: state.time + dt,
    cave: state.cave,
    rocks: state.rocks.filter(function(s) { return s.ttl >= 0 }),
    ships: state.ships,
    shots: state.shots.filter(function(s) { return s.ttl >= 0 }),
    debris: state.debris.filter(function(s) { return s.ttl >= 0 }),
    thrustParticles: state.thrustParticles.update(dt, state.cave.mesh.edges),
    explosions: state.explosions.update(dt),
    shards: state.shards.update(dt, state.cave.mesh.edges),
    smallShards: state.smallShards.update(dt, state.cave.mesh.edges),
    lastShotTime: state.lastShotTime,
    offset: state.ships[0].pos
  }

  function detectCollisions() {
    var collisions = []
    state.shots.forEach(function (s) {
      if (s.oldPos) {
        var edge = new Edge(s.oldPos, s.pos)
        if (state.cave.mesh.intersects(edge))
          collisions.push([null, s])
        state.rocks.concat(state.ships).forEach(function (s2) {
          if (s2.mesh.translate(s2.pos).intersects(edge))
            collisions.push([s2, s])
        })
      }
    })
    state.ships.forEach(function (s) {
      var shipMesh = s.mesh.rotate(s.angle).translate(s.pos)
      if (state.cave.mesh.intersects(shipMesh)) {
        collisions.push([null, s])
      }
      state.rocks.forEach(function(rock) {
        if (rock.mesh.rotate(rock.angle).translate(rock.pos).intersects(shipMesh))
          collisions.push([rock, s])
      })
    })
    return collisions
  }
}

function gameInitialize() {
  var meshRock = new Mesh(regularPolygon(8))
  var meshShip = new Mesh([[-7, 10], [18, 0], [-7, -10], [-2, -4], [-2, 4]])
  var ship = new Sprite(meshShip, [0, 0], [0, 0], Math.PI/2)
  var bot = new Sprite(meshShip, [-100, -50], [0, 0], Math.PI/2)
  var cavePoints = [[-400,-300],[-300,0],[-350,100],[-100,200],[0,320],[100,280],[400,230],[429,167],[411,67],[367,-11],[355,-91],[473,-20],[599,111],[805,183],[838,68],[901,-113],[1078,-324],[972,-541],[785,-593],[645,-670],[725,-1110],[536,-1202],[238,-1276],[15,-1130],[-119,-948],[-123,-791],[-134,-488],[175,-352],[472,-476],[664,-398],[659,-306],[655,-126],[597,-62],[541,-53],[350,-365],[250,-256],[200,-100],[50,-50],[0,-70],[-100,-200],[-150,-300],[-300,-350]]

  ship.update = function(state, input, config, dt) {
    if (input.fire && (state.time - state.lastShotTime > config.shotDelay)) {
      var shot = new Sprite()
      shot.ttl = config.shotTtl
      shot.unitV = vectorFromAngle(this.angle)
      shot.pos = this.pos.add(shot.unitV.mul(config.shotStartDistance))
      shot.v = this.v.add(shot.unitV.mul(config.shotSpeed))
      state.shots.push(shot)
      state.lastShotTime = state.time
    }
    if (input.left)
      this.angle += config.turnSpeed * dt
    if (input.right)
      this.angle -= config.turnSpeed * dt
    if (input.thrust) {
      this.v = this.v.add(vectorFromAngle(this.angle).mul(200 * dt))
      state.thrustParticles.emit(3, this)
    }
  }

  bot.update = function(state, input, config, dt) {
    var targetPos = [200, 100]
    var heading = targetPos.sub(this.pos).unit()
    var dot = heading.dot(vectorFromAngle(this.angle))
    if (dot < .95) {
      if (heading.orto().dot(vectorFromAngle(this.angle)) > 0)
        this.angle -= config.turnSpeed * dt
      else
        this.angle += config.turnSpeed * dt
      this.thrust = false
    } else {
      this.thrust = this.v.norm() < 60 || this.v[1] < 0
    }
    if (this.thrust) {
      this.v = this.v.add(vectorFromAngle(this.angle).mul(200 * dt))
      state.thrustParticles.emit(3, this)
    }
  }

  return {
    mode: Mode.GAME,
    frame: 0,
    time: 0,
    cave: {
      points: cavePoints,
      mesh: new Mesh(bezierPath(cavePoints, 8))
    },
    ships: [ship, bot],
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
    debris: [],
    thrustParticles: new ParticleSystem(1000, [0, -20], 0.3, genUniform(.4, .8), genUniform(Math.PI-Math.PI/4.4, Math.PI+Math.PI/4.4), 6, genUniform(40, 50)),
    explosions: new ParticleSystem(1000, [0,0], 0.95, genUniform(0.45,.9), genUniform(0, Math.PI*2), genUniform(0, 30), genUniform(30, 100)),
    shards: new ParticleSystem(1000, [0, -120], 0.3, genUniform(1.7, 2.4), genUniform(0, Math.PI*2), genUniform(0, 30), genUniform(50, 100)),
    smallShards: new ParticleSystem(1000, [0, -60], 0.8, genUniform(.5, 1.2), genUniform(0, Math.PI*2), genUniform(4, 8), genUniform(10, 50)),
    lastShotTime: 0,
    offset: [0, 0]
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
  this.vertexNormals = this.edges.map(function(e, i, edges) {
    var n2 = edges[(edges.length + i - 1) % edges.length].normal
    return e.normal.add(n2).mul(.5).unit()
  })
}

Mesh.prototype.triangles = function() {
  var res = []
  var vert = this.vertices.slice()

  range(vert.length - 3).forEach(function () {
    var convexVertices = range(vert.length).filter(isConvex)
    if (convexVertices.length > 0) {
      var v = convexVertices.reduce(function (a, b) {
        return vertexDot(a) > vertexDot(b) ? a : b
      })
      res.push(triangle(v))
      vert.splice(v, 1)
    }
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

Mesh.prototype.grow = function(factor) {
  var self = this
  return new Mesh(this.vertices.map(function(e, i) {
    return e.add(self.vertexNormals[i].mul(factor))
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

Mesh.prototype.boundingBox = function() {
  var first = this.vertices[0]
  var box = this.vertices.reduce(function(box, e) {
    return {
      maxX: Math.max(box.maxX, e[0]),
      minX: Math.min(box.minX, e[0]),
      maxY: Math.max(box.maxY, e[1]),
      minY: Math.min(box.minY, e[1])
    }
  }, {
      maxX: first[0],
      minX: first[0],
      maxY: first[1],
      minY: first[1]
    }
  )
  return {
    pos: [box.minX, box.minY],
    size: [box.maxX - box.minX, box.maxY - box.minY]
  }
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

ParticleSystem.prototype.update = function (dt, edges) {
  var self = this
  edges = edges || []
  this.particles.forEach(function (p) {
    p.ttl -= dt
    p.v = p.v.add(self.gravity.mul(dt))
    p.v = p.v.mul(Math.pow(1 - self.friction, dt))
    p.oldPos = p.pos
    p.pos = p.pos.add(p.v.mul(dt))
    var edge = new Edge(p.oldPos, p.pos)
    edges.forEach(function(e) {
      if (e.intersects(edge)) {
        p.v = p.v.reflect(e.normal).mul(.7)
        p.pos = p.oldPos
      }
    })
  })
  this.particles = this.particles.filter(function(p) { return p.ttl > 0 })
  return this
}
