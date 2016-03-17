
function gfxRender(state) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  if (!gl.isInitialized)
    throw new Error("gfxInitialize() not called")
  gl.clearColor(1, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)

  gl.useProgram(program.id)
  gl.uniform4f(program.uniform.color, 1, 1, 1, 1)

  var buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, state.time/2 % 1, .9]), gl.STATIC_DRAW)
  gl.vertexAttribPointer(program.attribute.pos, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(program.attribute.pos)
  gl.drawArrays(gl.LINE_STRIP, 0, 2)
  gl.deleteBuffer(buffer)
}

function gfxInitialize(canvas, shaders) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  program = createProgram(shaders['constant.vert'], shaders['constant.frag'], ['color'], ['pos'])
  gl.isInitialized = true

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