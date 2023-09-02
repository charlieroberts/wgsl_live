let c = `
const PI :f32 = 3.14159;
const PI2:f32 = 6.28318;

// colors adapted from The Force by Shawn Lawson
const black:vec3f = vec3f(0.0, 0.0, 0.0);
const white:vec3f = vec3f(1.0,1.0,1.0);
const red:vec3f = vec3f(0.86,0.22,0.27);
const orange:vec3f = vec3f(0.92,0.49,0.07);
const yellow:vec3f = vec3f(0.91,0.89,0.26);
const green:vec3f = vec3f(0.0,0.71,0.31);
const blue:vec3f = vec3f(0.05,0.35,0.65);
const purple:vec3f = vec3f(0.38,0.09,0.64);
const pink:vec3f = vec3f(.9,0.758,0.798);
const lime:vec3f = vec3f(0.361,0.969,0.282);
const teal:vec3f = vec3f(0.396,0.878,0.878);
const magenta:vec3f = vec3f(1.0, 0.189, 0.745);
const brown:vec3f = vec3f(0.96, 0.474, 0.227);

fn lastframe( pos : vec2f ) -> vec4f {
  return textureSample( backBuffer, backSampler, pos );
}

fn uv( pos: vec2f ) -> vec2f {
  return 2. * (pos.xy / res) - 1.;
}

fn uvN( pos: vec2f ) -> vec2f {
  return pos.xy / res;
}

fn seconds() -> f32 {
  return frame / 60.;
}

fn ms() -> f32 {
  return frame / 60. / 1000.;
}
`



export default c
