#version 100
precision mediump float;

uniform sampler2D sampler;
varying vec2 texCoord;

void main() {
    vec3 p = texture2D(sampler, texCoord).xyz;
    float x = (p.x + p.y + p.z) / 3.0;
    gl_FragColor = vec4(x, x, x, 1);
}
