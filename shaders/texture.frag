#version 100
precision mediump float;

uniform sampler2D sampler;
varying vec2 texCoord;

void main() {
    gl_FragColor = texture2D(sampler, texCoord);
}
