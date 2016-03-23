
function gfxRender(gl, ctx, config, state) {
  var baseMatrix = Matrix.scale(2 / gl.canvas.width, 2 / gl.canvas.height)

  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.framebuffer)
  withProgram(ctx.program, function(prg) {
    gl.clearColor.apply(gl, config.backgroundColor)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.lineWidth(2)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.caveColor))
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
    drawArray(state.cave.vertices, prg.attribute.pos, gl.LINE_LOOP)
    state.ships.forEach(drawSprite.bind(null, config.shipColor))
    state.rocks.forEach(drawSprite.bind(null, config.rockColor))
  })

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  withProgram(ctx.programTexture, function(prg) {
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Matrix().data.flatten())
    gl.uniform1i(prg.uniform.sampler, 0)
    gl.bindTexture(gl.TEXTURE_2D, ctx.texture)
    drawArray([[-1, 1, 0, 1], [1, 1, 1, 1], [-1, -1, 0, 0], [1, -1, 1, 0]], prg.attribute.vertex, gl.TRIANGLE_STRIP)
  })

  function withProgram(program, fn) {
    gl.useProgram(program.id)
    Object.keys(program.attribute).forEach(function(e) {
      gl.enableVertexAttribArray(program.attribute[e])
    })
    fn(program)
    Object.keys(program.attribute).forEach(function(e) {
      gl.disableVertexAttribArray(program.attribute[e])
    })
  }

  function drawSprite(color, sprite) {
    gl.uniform4fv(ctx.program.uniform.color, new Float32Array(color))
    var matrix = baseMatrix.mul(Matrix.translate(sprite.pos[0], sprite.pos[1])).mul(Matrix.rotate(sprite.angle))
    gl.uniformMatrix3fv(ctx.program.uniform.matrix, false, new Float32Array(matrix.transpose().data.flatten()))
    drawArray(sprite.mesh.vertices, ctx.program.attribute.pos, gl.LINE_LOOP)
  }

  function drawArray(points, attribute, mode) {
    var data = new Float32Array(points.flatten())
    if (data.length * 4 <= config.vertexBufferSize) {
      gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vertexBuffer)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data)
      gl.vertexAttribPointer(attribute, points[0].length, gl.FLOAT, false, 0, 0)
      gl.drawArrays(mode, 0, points.length)
    } else {
      throw new Error("vertexBufferSize overflow: " + (data.length * 4) + " > " + config.vertexBufferSize)
    }
  }
}

function gfxInitialize(canvas, shaders, config) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  var ctx = {
    program: createProgram(shaders['constant.vert'], shaders['constant.frag'], ['color', 'matrix'], ['pos']),
    programTexture: createProgram(shaders['texture.vert'], shaders['texture.frag'], ['sampler', 'matrix'], ['vertex']),
    framebuffer: gl.createFramebuffer(),
    texture: gl.createTexture(),
    vertexBuffer: gl.createBuffer()
  }
  gl.bindTexture(gl.TEXTURE_2D, ctx.texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ctx.texture, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, config.vertexBufferSize, gl.STREAM_DRAW)

  return {
    render: gfxRender.bind(null, gl, ctx, config),
    resize: function(width, height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)
      gl.bindTexture(gl.TEXTURE_2D, ctx.texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
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
