#version 100

uniform mat3 matrix;
attribute vec2 pos;
attribute vec2 texPos;
varying vec2 texCoord;

void main() {
    gl_Position = vec4(matrix * vec3(pos, 1), 1);
    texCoord = texPos;
}
