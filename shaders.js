// This file was generated by running command
//     scripts/build-shaders.sh shaders/constant.frag shaders/constant.vert
shaders = {
  'constant.frag':  "#version 120 \n"+
  " \n"+
  "void main() { \n"+
  "    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); \n"+
  "} \n"+
  "",
  'constant.vert':  "#version 120 \n"+
  " \n"+
  "void main() { \n"+
  "    gl_Position = vec4(vec3(0.0), 1.0); \n"+
  "} \n"+
  "",
}
