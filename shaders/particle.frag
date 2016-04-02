#version 100
precision mediump float;

uniform vec4 color;

void main() {
    if (distance(vec2(0.5, 0.5), gl_PointCoord) < 0.5)
        gl_FragColor = color;
    else
        discard;
}
