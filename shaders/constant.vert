#version 100

attribute vec2 pos;

void main() {
    gl_Position = vec4(pos, 0, 1);
}
