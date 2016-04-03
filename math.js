Array.prototype.add = function(other) {
  return [this[0] + other[0], this[1] + other[1]]
}

Array.prototype.sub = function(other) {
  return [this[0] - other[0], this[1] - other[1]]
}

Array.prototype.mul = function(value) {
  return [this[0] * value, this[1] * value]
}

Array.prototype.dot = function(other) {
  return this[0] * other[0] + this[1] * other[1]
}

Array.prototype.norm = function() {
  return Math.sqrt(this[0]*this[0] + this[1]*this[1])
}

Array.prototype.unit = function() {
  return this.mul(1 / this.norm())
}

Array.prototype.orto = function() {
  return [-this[1], this[0]]
}

Array.prototype.angle = function() {
  var a = Math.atan(this[1] / this[0])
  return  this[0] >= 0
    ? (this[1] > 0 ? 2*Math.PI - a : -a)
    : Math.PI - a
}

Array.prototype.rotate = function(a) {
  var ca = Math.cos(a)
  var sa = Math.sin(a)
  return [this[0]*ca - this[1]*sa, this[0]*sa + this[1]*ca]
}

function vectorFromAngle(a) {
  return [Math.cos(a), Math.sin(a)]
}

Array.prototype.flatten = function() {
  return this.concat.apply([], this)
}

function regularPolygon(n) {
  return range(n).map(function(e) {
    return vectorFromAngle(-Math.PI * 2 / n * e)
  })
}

function range(n) {
  var a = []
  for (var i=0; i<n; i++)
    a.push(i)
  return a
}

function Matrix() {
  this.data = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]]
}

Matrix.translate = function(v) {
  var m = new Matrix()
  m.data[0][2] = v[0]
  m.data[1][2] = v[1]
  return m
}

Matrix.prototype.translate = function(v) {
  return this.mul(Matrix.translate(v))
}

Matrix.scale = function(x, y) {
  var m = new Matrix()
  m.data[0][0] = x
  m.data[1][1] = y
  return m
}

Matrix.prototype.scale = function(x, y) {
  return this.mul(Matrix.scale(x,y ))
}

Matrix.rotate = function(a) {
  var m = new Matrix()
  var ca = Math.cos(a)
  var sa = Math.sin(a)
  m.data[0][0] = ca
  m.data[0][1] = -sa
  m.data[1][0] = sa
  m.data[1][1] = ca
  return m
}

Matrix.prototype.rotate = function(a) {
  return this.mul(Matrix.rotate(a))
}

Matrix.prototype.transpose = function() {
  var m = new Matrix()
  for(var j=0; j<3; j++)
    for(var i=0; i<3; i++)
      m.data[i][j] = this.data[j][i]
  return m
}

Matrix.prototype.mul = function(other) {
  var res = new Matrix()
  for (var j = 0; j < 3; j++)
    for (var i = 0; i < 3; i++) {
      var s = 0
      for (var n = 0; n < 3; n++)
        s += this.data[j][n] * other.data[n][i]
      res.data[j][i] = s
    }
  return res
}

Matrix.prototype.toString = function() {
  return "[" + this.data.map(function(e) { return "[" + e.join(" ") + "]" }).join(" ") + "]"
}

function Edge(a, b) {
  this.a = a
  this.b = b
  this.vector = b.sub(a)
  this.unit = this.vector.unit()
  this.normal = this.unit.orto()
}

Edge.prototype.inside = function(pos) {
  return pos.sub(this.a).dot(this.normal) > 0
}

Edge.prototype.intersects = function(other) {
  return this.inside(other.a) != this.inside(other.b)  &&  other.inside(this.a) != other.inside(this.b)
}

function bezierPath(controlPoints, segmentCount) {
  var res = []
  for (var i=0; i<controlPoints.length; i+=3) {
    var p = controlPoints.slice(i, i+4)
    switch (p.length) {
      case 1:
        p.push(controlPoints[0].add(p[0]).mul(1/3), controlPoints[0].add(p[0]).mul(2/3), controlPoints[0])
        break;
      case 2:
        p.push(controlPoints[0].add(p[1]).mul(.5), controlPoints[0]);
        break;
      case 3:
        p.push(controlPoints[0]);
        break;
    }
    for (var t=0; t<1; t+=1/segmentCount)
      res.push(bezier(p, t))
  }
  return res

  function bezier(cp, t) {
    return cp[0].mul(Math.pow(1 - t, 3))
      .add(cp[1].mul(3 * t * Math.pow(1 - t, 2)))
      .add(cp[2].mul(3 * (1 - t) * Math.pow(t, 2)))
      .add(cp[3].mul(Math.pow(t, 3)))
  }
}

function genUniform(min, max) {
  return function() {
    return Math.random() * (max - min) + min
  }
}