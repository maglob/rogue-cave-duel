
function gfxRender(gl, ctx, config, state) {
  var baseMatrix = Matrix.scale(2 / gl.canvas.width, 2 / gl.canvas.height)

  renderToTexture()

  gl.useProgram(ctx.program.id)
  gl.enableVertexAttribArray(ctx.program.attribute.pos)
  gl.clearColor.apply(gl, config.backgroundColor)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.lineWidth(2)
  gl.uniform4fv(ctx.program.uniform.color, new Float32Array(config.caveColor))
  gl.uniformMatrix3fv(ctx.program.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))

  drawArray(state.cave.vertices, ctx.program.attribute.pos, gl.LINE_LOOP)
  state.ships.forEach(drawSprite.bind(null, config.shipColor))
  state.rocks.forEach(drawSprite.bind(null, config.rockColor))

  gl.disableVertexAttribArray(ctx.program.attribute.pos)

  blitTextureToScreen()

  function renderToTexture() {
    gl.bindTexture(gl.TEXTURE_2D, ctx.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.framebuffer)
  }

  function blitTextureToScreen() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.useProgram(ctx.programTexture.id)
    gl.enableVertexAttribArray(ctx.programTexture.attribute.pos)
    gl.enableVertexAttribArray(ctx.programTexture.attribute.texPos)
    gl.uniformMatrix3fv(ctx.programTexture.uniform.matrix, false, baseMatrix.transpose().data.flatten())
    gl.uniform1i(ctx.programTexture.uniform.sampler, 0)
    gl.bindTexture(gl.TEXTURE_2D, ctx.texture)
    var buffer2 = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer2)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), gl.STREAM_DRAW)
    gl.vertexAttribPointer(ctx.programTexture.attribute.texPos, 2, gl.FLOAT, false, 0, 0)
    var w2 = gl.canvas.width / 2
    var h2 = gl.canvas.height / 2
    drawArray([[-w2, h2], [w2, h2], [-w2, -h2], [w2, -h2]], ctx.programTexture.attribute.pos, gl.TRIANGLE_STRIP)
    gl.deleteBuffer(buffer2)
    gl.disableVertexAttribArray(ctx.programTexture.attribute.pos)
    gl.disableVertexAttribArray(ctx.programTexture.attribute.texPos)
  }

  function drawSprite(color, sprite) {
    gl.uniform4fv(ctx.program.uniform.color, new Float32Array(color))
    var matrix = baseMatrix.mul(Matrix.translate(sprite.pos[0], sprite.pos[1])).mul(Matrix.rotate(sprite.angle))
    gl.uniformMatrix3fv(ctx.program.uniform.matrix, false, new Float32Array(matrix.transpose().data.flatten()))
    drawArray(sprite.mesh.vertices, ctx.program.attribute.pos, gl.LINE_LOOP)
  }

  function drawArray(points, attribute, mode) {
    var buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points.flatten()), gl.STREAM_DRAW)
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0)
    gl.drawArrays(mode, 0, points.length)
    gl.deleteBuffer(buffer)
  }
}

function gfxInitialize(canvas, shaders, config) {
  var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
  var ctx = {
    program: createProgram(shaders['constant.vert'], shaders['constant.frag'], ['color', 'matrix'], ['pos']),
    programTexture: createProgram(shaders['texture.vert'], shaders['texture.frag'], ['sampler', 'matrix'], ['pos', 'texPos']),
    framebuffer: gl.createFramebuffer(),
    texture: gl.createTexture()
  }
  gl.bindTexture(gl.TEXTURE_2D, ctx.texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ctx.texture, 0)

  return {
    render: gfxRender.bind(null, gl, ctx, config),
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
