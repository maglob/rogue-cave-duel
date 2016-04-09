function editorUpdate(state, input) {
  if (input.up)
    state.offset = state.offset.add([0, 8])
  if (input.down)
    state.offset = state.offset.add([0, -8])
  if (input.right)
    state.offset = state.offset.add([8, 0])
  if (input.left)
    state.offset = state.offset.add([-8, 0])

  if (input.mouseDown) {
    if (selection == null) {
      var v = state.cave.points.reduce(function (a, b) {
        return input.mouseWorldPos.distance(a) < input.mouseWorldPos.distance(b) ? a : b
      })
      if (input.mouseWorldPos.distance(v) < 8)
        selection = state.cave.points.indexOf(v)
    }
    if (selection >= 0) {
      state.cave.points[selection] = input.mouseWorldPos
      state.cave.mesh = new Mesh(bezierPath(state.cave.points, 8))
    }
  } else
    selection = null

  if (input.remove) {
    var v = state.cave.points.reduce(function (a, b) {
      return input.mouseWorldPos.distance(a) < input.mouseWorldPos.distance(b) ? a : b
    })
    if (input.mouseWorldPos.distance(v) < 8) {
      state.cave.points.splice(state.cave.points.indexOf(v), 1)
      state.cave.mesh = new Mesh(bezierPath(state.cave.points, 8))
    }
    input.remove = false
  }

  if (input.add) {
    var edge = new Mesh(state.cave.points).edges.reduce(function (a,b) {
      return a.distance(input.mouseWorldPos) < b.distance(input.mouseWorldPos) ? a : b
    })
    if (edge.distance(input.mouseWorldPos) < 8) {
      var idx = state.cave.points.indexOf(edge.b)
      state.cave.points.splice(idx, 0, input.mouseWorldPos)
      state.cave.mesh = new Mesh(bezierPath(state.cave.points, 8))
    }
    input.add = false
  }

  return state
}
