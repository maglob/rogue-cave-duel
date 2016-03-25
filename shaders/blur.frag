#version 100
precision mediump float;

uniform sampler2D sampler;
uniform vec2 delta;
varying vec2 texCoord;

void main() {
    const int KERNEL_SIZE = 3;
    float kernel[KERNEL_SIZE];
    kernel[0] = 1.0;
    kernel[1] = 1.0;
    kernel[2] = 1.0;
    vec3 p = texture2D(sampler, texCoord).xyz * kernel[0];
    for(int i=1; i<KERNEL_SIZE; i++) {
        p += texture2D(sampler, texCoord + delta*float(i)).xyz * kernel[i];
        p += texture2D(sampler, texCoord - delta*float(i)).xyz * kernel[i];
    }
    gl_FragColor = vec4(p / (float(KERNEL_SIZE)*2.0 - 1.0), 1.0);
}
