function gameUpdate(state, dt) {
  return {
    time: state.time + dt
  }
}

function gameInitialize() {
  return {
    time: 0
  }
}