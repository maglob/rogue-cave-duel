
function gfxRender(gl, ctx, config, state) {
  var baseMatrix = Matrix.scale(2 / gl.canvas.width, 2 / gl.canvas.height).translate(state.ships[0].pos.mul(-1))

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
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

  withProgram(ctx.programParticle, function(prg) {
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.shotColor))
    gl.uniform1f(prg.uniform.size, 3)
    gl.uniformMatrix3fv(prg.uniform.matrix, false, baseMatrix.transpose().data.flatten())
    drawArray(state.shots.map(function (s) { return s.pos }), prg.attribute.pos, gl.POINTS)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.thrustColor))
    gl.uniform1f(prg.uniform.size, 4)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    drawArray(state.thrustParticles.particles.map(function(p) { return p.pos }), prg.attribute.pos, gl.POINTS)
    gl.disable(gl.BLEND)
  })

  gl.bindFramebuffer(gl.FRAMEBUFFER, ctx.framebuffers[2].id)
  gl.viewport(0, 0, ctx.framebuffers[2].width, ctx.framebuffers[2].height)
  withProgram(ctx.program, function(prg) {
    gl.clearColor.apply(gl, [0, 0, 0, 1])
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.lineWidth(2)
    gl.uniform4fv(prg.uniform.color, new Float32Array([1, 1, .3, 1]))
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
    drawArray(state.cave.vertices, prg.attribute.pos, gl.LINE_LOOP)
  })

  doBlur(ctx.framebuffers[2], ctx.framebuffers[3], [1.0/gl.canvas.width, 0])
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE)
  doBlur(ctx.framebuffers[3], null, [0, 1.0/gl.canvas.height])
  gl.disable(gl.BLEND)

  function doBlur(srcFramebuffer, destFramebuffer, delta) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, destFramebuffer ? destFramebuffer.id : null)
    gl.viewport(0, 0, destFramebuffer ? destFramebuffer.width : gl.canvas.width, destFramebuffer ? destFramebuffer.height : gl.canvas.height)
    withProgram(ctx.effectBlur, function(prg) {
      var kernel = [.7, .45, .25, .15, .05]
      gl.uniform1i(prg.uniform.kernel_size, kernel.length)
      gl.uniform1fv(prg.uniform.kernel, new Float32Array(kernel))
      gl.uniform1i(prg.uniform.sampler, 0)
      gl.uniform2fv(prg.uniform.delta, new Float32Array(delta))
      gl.bindTexture(gl.TEXTURE_2D, srcFramebuffer.texture)
      drawArray([[-1, 1, 0, 1], [1, 1, 1, 1], [-1, -1, 0, 0], [1, -1, 1, 0]], prg.attribute.vertex, gl.TRIANGLE_STRIP)
    })
  }

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
    var matrix = baseMatrix.translate(sprite.pos).rotate(sprite.angle)
    gl.uniformMatrix3fv(ctx.program.uniform.matrix, false, new Float32Array(matrix.transpose().data.flatten()))
    drawArray(sprite.mesh.vertices, ctx.program.attribute.pos, gl.LINE_LOOP)
  }

  function drawArray(points, attribute, mode) {
    if (!points || points.length == 0)
      return
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
  var framebuffers = range(4).map(function(i) {
    var id = gl.createFramebuffer()
    var texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, id)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
    return {
      id: id,
      texture: texture,
      scale: i < 2 ? 1 : 0.5
    }
  })
  var ctx = {
    program: createProgram(shaders['constant.vert'], shaders['constant.frag'], ['color', 'matrix'], ['pos']),
    programParticle: createProgram(shaders['particle.vert'], shaders['particle.frag'], ['color', 'matrix', 'size'], ['pos']),
    effectGrayscale: createProgram(shaders['effect.vert'], shaders['grayscale.frag'], ['sampler'], ['vertex']),
    effectDither: createProgram(shaders['effect.vert'], shaders['dither.frag'], ['sampler'], ['vertex']),
    effectBlur: createProgram(shaders['effect.vert'], shaders['blur.frag'], ['sampler', 'delta', 'kernel', 'kernel_size'], ['vertex']),
    framebuffers: framebuffers,
    vertexBuffer: gl.createBuffer()
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, ctx.vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, config.vertexBufferSize, gl.STREAM_DRAW)

  return {
    render: gfxRender.bind(null, gl, ctx, config),
    resize: function(width, height) {
      canvas.width = width
      canvas.height = height
      ctx.framebuffers.forEach(function(fb) {
        fb.width = gl.canvas.width * fb.scale
        fb.height = gl.canvas.height * fb.scale
        gl.bindTexture(gl.TEXTURE_2D, fb.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      })
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
