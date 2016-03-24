#version 100
precision mediump float;

uniform sampler2D sampler;
varying vec2 texCoord;

void main() {
    if (mod(gl_FragCoord.y, 2.0) < 1.0)
        gl_FragColor = vec4(texture2D(sampler, texCoord).xyz, 1);
    else
        gl_FragColor = vec4(.1, .1, .1, 1);
}
