const n = `// noise taken/adapted from https://gist.github.com/munrocket/236ed5ba7e409b8bdf1ff6eca5dcdc39
fn rand2(n: vec2f) -> f32 {
  return fract(sin(dot(n, vec2f(12.9898, 4.1414))) * 43758.5453);
}

fn noise2(n: vec2f) -> f32 {
  let d = vec2f(0., 1.);
  let b = floor(n);
  let f = smoothstep(vec2f(0.), vec2f(1.), fract(n));
  return mix(mix(rand2(b), rand2(b + d.yx), f.x), mix(rand2(b + d.xy), rand2(b + d.yy), f.x), f.y);
}

// MIT License. © Stefan Gustavson, Munrocket
fn permute4(x: vec4f) -> vec4f { return ((x * 34. + 1.) * x) % vec4f(289.); }
fn fade2(t: vec2f) -> vec2f { return t * t * t * (t * (t * 6. - 15.) + 10.); }

fn perlin2(P: vec2f) -> f32 {
  var Pi: vec4f = floor(P.xyxy) + vec4f(0., 0., 1., 1.);
  let Pf = fract(P.xyxy) - vec4f(0., 0., 1., 1.);
  Pi = Pi % vec4f(289.); // To avoid truncation effects in permutation
  let ix = Pi.xzxz;
  let iy = Pi.yyww;
  let fx = Pf.xzxz;
  let fy = Pf.yyww;
  let i = permute4(permute4(ix) + iy);
  var gx: vec4f = 2. * fract(i * 0.0243902439) - 1.; // 1/41 = 0.024...
  let gy = abs(gx) - 0.5;
  let tx = floor(gx + 0.5);
  gx = gx - tx;
  var g00: vec2f = vec2f(gx.x, gy.x);
  var g10: vec2f = vec2f(gx.y, gy.y);
  var g01: vec2f = vec2f(gx.z, gy.z);
  var g11: vec2f = vec2f(gx.w, gy.w);
  let norm = 1.79284291400159 - 0.85373472095314 *
      vec4f(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 = g00 * norm.x;
  g01 = g01 * norm.y;
  g10 = g10 * norm.z;
  g11 = g11 * norm.w;
  let n00 = dot(g00, vec2f(fx.x, fy.x));
  let n10 = dot(g10, vec2f(fx.y, fy.y));
  let n01 = dot(g01, vec2f(fx.z, fy.z));
  let n11 = dot(g11, vec2f(fx.w, fy.w));
  let fade_xy = fade2(Pf.xy);
  let n_x = mix(vec2f(n00, n01), vec2f(n10, n11), vec2f(fade_xy.x));
  let n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}

//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket, Johan Helsing
//
fn mod289(x: vec2f) -> vec2f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn mod289_3(x: vec3f) -> vec3f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn permute3(x: vec3f) -> vec3f {
    return mod289_3(((x * 34.) + 1.) * x);
}

//  MIT License. © Ian McEwan, Stefan Gustavson, Munrocket
fn simplex2(v: vec2f) -> f32 {
    let C = vec4(
        0.211324865405187, // (3.0-sqrt(3.0))/6.0
        0.366025403784439, // 0.5*(sqrt(3.0)-1.0)
        -0.577350269189626, // -1.0 + 2.0 * C.x
        0.024390243902439 // 1.0 / 41.0
    );

    // First corner
    var i = floor(v + dot(v, C.yy));
    let x0 = v - i + dot(i, C.xx);

    // Other corners
    var i1 = select(vec2(0., 1.), vec2(1., 0.), x0.x > x0.y);

    // x0 = x0 - 0.0 + 0.0 * C.xx ;
    // x1 = x0 - i1 + 1.0 * C.xx ;
    // x2 = x0 - 1.0 + 2.0 * C.xx ;
    var x12 = x0.xyxy + C.xxzz;
    x12.x = x12.x - i1.x;
    x12.y = x12.y - i1.y;

    // Permutations
    i = mod289(i); // Avoid truncation effects in permutation

    var p = permute3(permute3(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    var m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3(0.));
    m *= m;
    m *= m;

    // Gradients: 41 points uniformly over a line, mapped onto a diamond.
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
    let x = 2. * fract(p * C.www) - 1.;
    let h = abs(x) - 0.5;
    let ox = floor(x + 0.5);
    let a0 = x - ox;

    // Normalize gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // Compute final noise value at P
    let g = vec3(a0.x * x0.x + h.x * x0.y, a0.yz * x12.xz + h.yz * x12.yw);
    return 130. * dot(m, g);
}
//  <https://www.shadertoy.com/view/Xd23Dh>
//  by Inigo Quilez
//
fn hash23(p: vec2f) -> vec3f {
  let q = vec3f(dot(p, vec2f(127.1, 311.7)),
      dot(p, vec2f(269.5, 183.3)),
      dot(p, vec2f(419.2, 371.9)));
  return fract(sin(q) * 43758.5453);
}

// MIT License. © Stefan Gustavson, Munrocket
//
fn taylorInvSqrt4(r: vec4f) -> vec4f { return 1.79284291400159 - 0.85373472095314 * r; }
fn fade3(t: vec3f) -> vec3f { return t * t * t * (t * (t * 6. - 15.) + 10.); }

fn perlin3(P: vec3f) -> f32 {
  var Pi0 : vec3f = floor(P); // Integer part for indexing
  var Pi1 : vec3f = Pi0 + vec3f(1.); // Integer part + 1
  Pi0 = Pi0 % vec3f(289.);
  Pi1 = Pi1 % vec3f(289.);
  let Pf0 = fract(P); // Fractional part for interpolation
  let Pf1 = Pf0 - vec3f(1.); // Fractional part - 1.
  let ix = vec4f(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  let iy = vec4f(Pi0.yy, Pi1.yy);
  let iz0 = Pi0.zzzz;
  let iz1 = Pi1.zzzz;

  let ixy = permute4(permute4(ix) + iy);
  let ixy0 = permute4(ixy + iz0);
  let ixy1 = permute4(ixy + iz1);

  var gx0: vec4f = ixy0 / 7.;
  var gy0: vec4f = fract(floor(gx0) / 7.) - 0.5;
  gx0 = fract(gx0);
  var gz0: vec4f = vec4f(0.5) - abs(gx0) - abs(gy0);
  var sz0: vec4f = step(gz0, vec4f(0.));
  gx0 = gx0 + sz0 * (step(vec4f(0.), gx0) - 0.5);
  gy0 = gy0 + sz0 * (step(vec4f(0.), gy0) - 0.5);

  var gx1: vec4f = ixy1 / 7.;
  var gy1: vec4f = fract(floor(gx1) / 7.) - 0.5;
  gx1 = fract(gx1);
  var gz1: vec4f = vec4f(0.5) - abs(gx1) - abs(gy1);
  var sz1: vec4f = step(gz1, vec4f(0.));
  gx1 = gx1 - sz1 * (step(vec4f(0.), gx1) - 0.5);
  gy1 = gy1 - sz1 * (step(vec4f(0.), gy1) - 0.5);

  var g000: vec3f = vec3f(gx0.x, gy0.x, gz0.x);
  var g100: vec3f = vec3f(gx0.y, gy0.y, gz0.y);
  var g010: vec3f = vec3f(gx0.z, gy0.z, gz0.z);
  var g110: vec3f = vec3f(gx0.w, gy0.w, gz0.w);
  var g001: vec3f = vec3f(gx1.x, gy1.x, gz1.x);
  var g101: vec3f = vec3f(gx1.y, gy1.y, gz1.y);
  var g011: vec3f = vec3f(gx1.z, gy1.z, gz1.z);
  var g111: vec3f = vec3f(gx1.w, gy1.w, gz1.w);

  let norm0 = taylorInvSqrt4(
      vec4f(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 = g000 * norm0.x;
  g010 = g010 * norm0.y;
  g100 = g100 * norm0.z;
  g110 = g110 * norm0.w;
  let norm1 = taylorInvSqrt4(
      vec4f(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 = g001 * norm1.x;
  g011 = g011 * norm1.y;
  g101 = g101 * norm1.z;
  g111 = g111 * norm1.w;

  let n000 = dot(g000, Pf0);
  let n100 = dot(g100, vec3f(Pf1.x, Pf0.yz));
  let n010 = dot(g010, vec3f(Pf0.x, Pf1.y, Pf0.z));
  let n110 = dot(g110, vec3f(Pf1.xy, Pf0.z));
  let n001 = dot(g001, vec3f(Pf0.xy, Pf1.z));
  let n101 = dot(g101, vec3f(Pf1.x, Pf0.y, Pf1.z));
  let n011 = dot(g011, vec3f(Pf0.x, Pf1.yz));
  let n111 = dot(g111, Pf1);

  var fade_xyz: vec3f = fade3(Pf0);
  let temp = vec4f(f32(fade_xyz.z)); // simplify after chrome bug fix
  let n_z = mix(vec4f(n000, n100, n010, n110), vec4f(n001, n101, n011, n111), temp);
  let n_yz = mix(n_z.xy, n_z.zw, vec2f(f32(fade_xyz.y))); // simplify after chrome bug fix
  let n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`

export default n
