#version 100

uniform mat3 matrix;
attribute vec2 pos;

void main() {
    gl_Position = vec4(matrix * vec3(pos, 1), 1);
}
