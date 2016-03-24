#version 100

attribute vec4 vertex;
varying vec2 texCoord;

void main() {
    gl_Position = vec4(vertex.xy, 0, 1);
    texCoord = vertex.zw;
}
