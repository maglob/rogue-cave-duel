#version 100

uniform mat3 matrix;
uniform float size;
attribute vec2 pos;

void main() {
    gl_Position = vec4(matrix * vec3(pos, 1), 1);
    gl_PointSize = size;
}
