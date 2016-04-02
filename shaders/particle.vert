#version 100

uniform mat3 matrix;
attribute vec3 data;

void main() {
    gl_Position = vec4(matrix * vec3(data.xy, 1), 1);
    gl_PointSize = data[2];
}
