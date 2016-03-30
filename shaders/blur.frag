#version 100
precision mediump float;

const int MAX_KERNEL_SIZE = 20;
uniform sampler2D sampler;
uniform float kernel[MAX_KERNEL_SIZE];
uniform int kernel_size;
uniform vec2 delta;
varying vec2 texCoord;

void main() {
    vec3 p = texture2D(sampler, texCoord).xyz * kernel[0];
    float weight_sum = kernel[0];
    int j = 1;
    for (int i=1; i<MAX_KERNEL_SIZE; i++) {
        if (j++ >= kernel_size)
            break;
        weight_sum += kernel[i] * 2.0;
        p += texture2D(sampler, texCoord + delta*float(i)).xyz * kernel[i];
        p += texture2D(sampler, texCoord - delta*float(i)).xyz * kernel[i];
    }
    gl_FragColor = vec4(p / weight_sum, 1.0);
}
