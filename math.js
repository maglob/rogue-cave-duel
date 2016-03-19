Array.prototype.add = function(other) {
  return [this[0] + other[0], this[1] + other[1]]
}

Array.prototype.sub = function(other) {
  return [this[0] - other[0], this[1] - other[1]]
}

Array.prototype.mul = function(other) {
  return Array.isArray(other) ? this[0]*other[0] + this[1]*other[1] : [this[0]*other, this[1]*other]
}

Array.prototype.norm = function() {
  return Math.sqrt(this[0]*this[0] + this[1]*this[1])
}

Array.prototype.unit = function() {
  return this.mul(1 / this.norm())
}

Array.prototype.angle = function() {
  var a = Math.atan(this[1] / this[0])
  return  this[0] >= 0
    ? (this[1] > 0 ? 2*Math.PI - a : -a)
    : Math.PI - a
}

function vectorFromAngle(a) {
  return [Math.cos(a), Math.sin(a)]
}

Array.prototype.flatten = function() {
  return this.concat.apply([], this)
}

function regularPolygon(n) {
  return range(n).map(function(e) {
    return vectorFromAngle(Math.PI * 2 / n * e)
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

Matrix.translate = function(x, y) {
  var m = new Matrix()
  m.data[0][2] = x
  m.data[1][2] = y
  return m
}

Matrix.scale = function(x, y) {
  var m = new Matrix()
  m.data[0][0] = x
  m.data[1][1] = y
  return m
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
