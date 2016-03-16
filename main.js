window.onload = function() {
  (function tick(state, time) {
    render(document.getElementById('canvas'), (time/10)%100)
    window.requestAnimationFrame(tick.bind(null, state))
  })()
}

function render(canvas, x) {
  var gc = canvas.getContext("2d")
  gc.fillStyle = "red"
  gc.clearRect(0, 0, canvas.width, canvas.height)
  gc.fillRect(10, 10, 2*x, x)
}
