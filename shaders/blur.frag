#version 100
precision mediump float;

uniform sampler2D sampler;
uniform vec2 delta;
varying vec2 texCoord;

void main() {
    const int KERNEL_SIZE = 5;
    float kernel[KERNEL_SIZE];
    kernel[0] = .7;
    kernel[1] = .45;
    kernel[2] = .25;
    kernel[3] = .15;
    kernel[4] = .05;
    vec3 p = texture2D(sampler, texCoord).xyz * kernel[0];
    float weight_sum = kernel[0];
    for(int i=1; i<KERNEL_SIZE; i++) {
        weight_sum += kernel[i] * 2.0;
        p += texture2D(sampler, texCoord + delta*float(i)).xyz * kernel[i];
        p += texture2D(sampler, texCoord - delta*float(i)).xyz * kernel[i];
    }
    gl_FragColor = vec4(p / weight_sum, 1.0);
}
