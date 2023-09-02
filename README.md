# wgsl_live

## Try it
Make sure you're running Chrome or Edge on Windows or macOS. Firefox Nightly can work for some features (including for Linux). I personally haven't had much luck with Chromium / Chrome under Linux but you might do better, especially if you have a NVIDIA graphics card.

- [Playground](https://charlieroberts.github.io/wgsl_live)
- [Intro Tutorial](https://github.com/imgd-4099-2023/imgd-4099-2023/blob/main/notes.day1.intro_to_shaders.md)

## What is it?
This is a system for live coding fragment shaders using WGSL / WebGPU. Current features include:

- Live video textures and FFT audio analysis
- Back buffer support
- Convenience functions for accessing video / back buffer
- A variety of constants
- Noise functions

This environment is inspired by Shawn Lawson's fantastic environment [The Force](https://github.com/shawnlawson/The_Force/). The goal is for this to serve as a similar project for WGSL instead of OpenGL/GLSL.

## Reference
These are the uniforms / functions that the environment adds to WGSL. For a reference on standard WGSL functions I recommend [WebGPU.rocks](https://webgpu.rocks/wgsl/functions/numeric/).

```c-like
/* UNIFORMS */
frame : f32 - the numer of frames since the environment was launched
res : vec2f - the width / height of the environment window
mouse : vec3f - the x position, y position, and left button status
audio : vec3f - low, mid, and high frequency values from fft (scroll down and hit the 'audio on' button to start the analysis).
backBuffer : texture_2d<f32> - stores the previous frame of video
backSampler: sampler - sampler linked to backBuffer for use in calls to textureSample()  
videoBuffer: texture_external - live webcam feed texture CHROME ONLY
videoSampler: sampler - sampler linked to videoBuffer CHROME ONLY

/* CONSTANTS */
PI : f32
PI2 : f32
red, green, blue, purple, pink, teal, black, white, orange, magenta, brown yellow : vec3f

/* CONVENIENCE FUNCTIONS */
uv( vec2f ) -> vec2f - converts a x/y position in pixels (like what is passed to the fragment shader by default in wgsl_live) to a range of -1 to 1.

uvN( vec2f ) -> vec2f - converts a x/y position in pixels (like what is passed to the fragment shader by default in wgsl_live) to a range of 0 to 1.

lastframe( vec2f ) -> vec4f - expects normalized texture coordinates, and returns a sample from the back buffer

video( vec2f ) -> vec4f - CHROME ONLY. expects noramlized texture coordinates, and returns a sample from the webcam feed.

/* NOISE FUNCTIONS */

noise2( vec2f ) -> f32 - 2D value noise
simplex2( vec2 ) -> f32 - 2D simplex noise
perlin2( vec2f ) -> f32 - 2D Perlin noise
perlin3( vec3f ) -> f32 - 3D Perlin noise

```
