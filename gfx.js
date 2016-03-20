
function gfxRender(gl, program, config, state) {
  var baseMatrix = Matrix.scale(2 / gl.canvas.width, 2 / gl.canvas.height)
  gl.clearColor.apply(gl, config.backgroundColor)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(program.id)
  gl.enableVertexAttribArray(program.attribute.pos)
  gl.lineWidth(2)

  gl.uniform4fv(program.uniform.color, new Float32Array(config.caveColor))
  gl.uniformMatrix3fv(program.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
  drawArray(state.cave.vertices, gl.LINE_LOOP)

  state.ships.forEach(drawSprite.bind(null, config.shipColor))
  state.rocks.forEach(drawSprite.bind(null, config.rockColor))

  function drawSprite(color, sprite) {
    gl.uniform4fv(program.uniform.color, new Float32Array(color))
    var matrix = baseMatrix.mul(Matrix.translate(sprite.pos[0], sprite.pos[1])).mul(Matrix.rotate(sprite.angle))
    gl.uniformMatrix3fv(program.uniform.matrix, false, new Float32Array(matrix.transpose().data.flatten()))
    drawArray(sprite.mesh.vertices, gl.LINE_LOOP)
  }

  function drawArray(points, mode) {
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flatten()), gl.STREAM_DRAW)
    gl.vertexAttribPointer(program.attribute.pos, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(mode, 0, points.length)
    gl.deleteBuffer(buffer)
  }
}

function gfxInitialize(canvas, shaders, config) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  var program = createProgram(shaders['constant.vert'], shaders['constant.frag'], ['color', 'matrix'], ['pos'])

  return {
    render: gfxRender.bind(null, gl, program, config),
    resize: function(width, height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
    }
  }

  function createProgram(glslVert, glslFrag, uniforms, attributes) {
    var id = gl.createProgram()
    gl.attachShader(id, compileShader(glslVert, gl.VERTEX_SHADER))
    gl.attachShader(id, compileShader(glslFrag, gl.FRAGMENT_SHADER))
    gl.linkProgram(id)
    if (!gl.getProgramParameter(id, gl.LINK_STATUS))
      throw new Error("Error while linking shader program")

    return {
      id: id,
      uniform: uniforms.reduce(function(obj, name) {
        obj[name] = gl.getUniformLocation(id, name)
        return obj
      }, {}),
      attribute: attributes.reduce(function(obj, name) {
        obj[name] = gl.getAttribLocation(id, name)
        return obj
      }, {})
    }

    function compileShader(source, type) {
      var shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error("Error while compiling shader: " + gl.getShaderInfoLog(shader))
      return shader
    }
  }
}
