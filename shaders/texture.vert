#version 100

uniform mat3 matrix;
attribute vec4 vertex;
varying vec2 texCoord;

void main() {
    gl_Position = vec4(matrix * vec3(vertex.xy, 1), 1);
    texCoord = vertex.zw;
}
