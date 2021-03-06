
function gfxRender(gl, ctx, config, state) {
  var baseMatrix = Matrix.scale(2 / gl.canvas.width, 2 / gl.canvas.height).translate(state.offset.mul(-1))

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.enable(gl.STENCIL_TEST)

  withProgram(ctx.program, function(prg) {
    gl.clearColor.apply(gl, state.mode == Mode.EDIT ? config.caveBackgroundColor : config.backgroundColor)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT)
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
    var caveTriangles = new Mesh(state.cave.mesh.vertices).triangles().flatten()
    makeStencil(function() {
      gl.uniform4fv(prg.uniform.color, new Float32Array(config.caveBackgroundColor))
      drawArray(caveTriangles, prg.attribute.pos, gl.TRIANGLES)
    })

    gl.uniform4fv(prg.uniform.color, new Float32Array(config.caveBackgroundColor))
    drawArray(caveTriangles, prg.attribute.pos, gl.TRIANGLES)

    gl.lineWidth(2)
    state.ships.forEach(drawSprite.bind(null, config.shipColor))
    state.debris.forEach(drawSprite.bind(null, config.debrisColor))
  })

  withProgram(ctx.programTexture, function(prg) {
    gl.uniform1i(prg.uniform.sampler, 0)
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
    gl.bindTexture(gl.TEXTURE_2D, ctx.caveTexture);
    gl.disable(gl.STENCIL_TEST)
    drawTexturedPolygonLine(state.cave.mesh, 10)
    gl.enable(gl.STENCIL_TEST)
    gl.bindTexture(gl.TEXTURE_2D, ctx.rockTexture);
    state.rocks.forEach(function(sprite) {
      var matrix = baseMatrix.translate(sprite.pos).rotate(sprite.angle)
      gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(matrix.transpose().data.flatten()))
      drawTexturedPolygonLine(sprite.mesh, 10)
    })
  })

  withProgram(ctx.programParticle, function(prg) {
    gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.shotTrailColor))
    drawArray(state.shots.map(function (s) {
      return [s.pos.add(s.unitV.mul(-3)).concat(4), s.pos.add(s.unitV.mul(-5)).concat(2), s.pos.add(s.unitV.mul(-7)).concat(1)]
    }).flatten(), prg.attribute.data, gl.POINTS)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.shotColor))
    drawArray(state.shots.map(function (s) { return s.pos.concat(5) }), prg.attribute.data, gl.POINTS)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.thrustColor))
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE)
    drawArray(state.thrustParticles.particles.map(function(p) { return p.pos.concat(p.ttl/.1+2) }), prg.attribute.data, gl.POINTS)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.explosionColor))
    drawArray(state.explosions.particles.map(function(p) { return p.pos.concat(p.ttl/.015) }), prg.attribute.data, gl.POINTS)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.shardColor))
    drawArray(state.shards.particles.map(function(p) { return p.pos.concat(3) }), prg.attribute.data, gl.POINTS)
    gl.uniform4fv(prg.uniform.color, new Float32Array(config.smallShardColor))
    drawArray(state.smallShards.particles.map(function(p) { return p.pos.concat(2) }), prg.attribute.data, gl.POINTS)
    gl.disable(gl.BLEND)
  })

  gl.disable(gl.STENCIL_TEST)

  if (state.mode == Mode.EDIT) {
    withProgram(ctx.program, function(prg) {
      gl.lineWidth(1)
      gl.uniform4fv(prg.uniform.color, new Float32Array([1, 1, 1, 1]))
      gl.uniformMatrix3fv(prg.uniform.matrix, false, new Float32Array(baseMatrix.transpose().data.flatten()))
      drawArray(state.cave.points, prg.attribute.pos, gl.LINE_LOOP)
      var marker = new Mesh(regularPolygon(4)).scale(8)
      state.cave.points.map(function(p) { return new Sprite(marker, p)}).forEach(drawSprite.bind(null, [1, 1, 0, 1]))
      if (state.editor.hover != null) {
        gl.lineWidth(3)
        drawSprite([1, 1, 0, 1], new Sprite(marker, state.cave.points[state.editor.hover]))
      }
    })
  }

  return state

  function makeStencil(fn) {
    gl.stencilMask(0x1)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE)
    gl.colorMask(false, false, false, false)
    gl.stencilFunc(gl.ALWAYS, 1, 0)
    fn()
    gl.colorMask(true, true, true, true)
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP)
    gl.stencilFunc(gl.EQUAL, 1, 0x1)
    gl.stencilMask(0)
  }

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

  function drawTexturedPolygonLine(mesh, width) {
    var idx = mesh.vertices.length - 1
    var lastVertex = mesh.vertices[idx]
    var lastNormal = mesh.vertexNormals[idx]
    var points = mesh.vertices.reduce(function(acc, v, i) {
      var n = mesh.vertexNormals[i]
      return acc.concat([v.add(n.mul(width/2)).concat(0, 0), v.add(n.mul(-width/2)).concat(1, 1)])
    }, [lastVertex.add(lastNormal.mul(width/2)).concat(0, 0), lastVertex.add(lastNormal.mul(-width/2)).concat(1, 1)])
    drawArray(points, ctx.programTexture.attribute.vertex, gl.TRIANGLE_STRIP)
  }
}

function gfxInitialize(canvas, shaders, config) {
  var options = {
    stencil: true
  }
  var gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options)
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
    programParticle: createProgram(shaders['particle.vert'], shaders['particle.frag'], ['color', 'matrix'], ['data']),
    programTexture: createProgram(shaders['texture.vert'], shaders['texture.frag'], ['sample', 'matrix'], ['vertex']),
    effectGrayscale: createProgram(shaders['effect.vert'], shaders['grayscale.frag'], ['sampler'], ['vertex']),
    effectDither: createProgram(shaders['effect.vert'], shaders['dither.frag'], ['sampler'], ['vertex']),
    effectBlur: createProgram(shaders['effect.vert'], shaders['blur.frag'], ['sampler', 'delta', 'kernel', 'kernel_size'], ['vertex']),
    framebuffers: framebuffers,
    vertexBuffer: gl.createBuffer(),
    rockTexture: createGlowTexture(config.rockColor),
    caveTexture: createGlowTexture(config.caveColor)
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
    },
    getSize: function() {
      return [canvas.width, canvas.height]
    }
  }

  function createGlowTexture(color) {
    var tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex);
    var weights = [255/8, 255/4, 255/3, 255]
    var data = weights.map(function(w) {
      return [w * color[0], w * color[1], w * color[2], 255 * color[3]]
    })
    var image = new ImageData(new Uint8ClampedArray(data.concat(data.slice().reverse()).flatten()), weights.length * 2, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    return tex
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
