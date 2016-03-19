
function gfxRender(gl, program, state) {
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(program.id)
  gl.enableVertexAttribArray(program.attribute.pos)
  gl.uniform4f(program.uniform.color, 1, 1, 1, 1)
  gl.uniformMatrix3fv(program.uniform.matrix, false, new Float32Array(Matrix.scale(2,2).data.flatten()))

  drawArray(range(8).map(function(i) {
    return vectorFromAngle(Math.PI * 2 / 8 * i + state.time).mul(.5)
  }), gl.LINE_STRIP)

  function drawArray(points, mode) {
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flatten()), gl.STREAM_DRAW)
    gl.vertexAttribPointer(program.attribute.pos, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(mode, 0, points.length)
    gl.deleteBuffer(buffer)
  }
}

function gfxInitialize(canvas, shaders) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  var program = createProgram(shaders['constant.vert'], shaders['constant.frag'], ['color', 'matrix'], ['pos'])

  return {
    render: gfxRender.bind(null, gl, program),
    resize: function(width, height) {
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
