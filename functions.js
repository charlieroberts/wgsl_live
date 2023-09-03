const v = `fn lastframe( pos : vec2f ) -> vec4f {
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
  return (frame / 60.) / 1000.;
}

fn rotate( _uv : vec2f, angle : f32 ) -> vec2f{
  var uv : vec2f = _uv - 0.5;
  uv =  mat2x2<f32>(cos(angle),-sin(angle),
                     sin(angle),cos(angle)) * uv;
  uv += 0.5;
  return uv;
}`

export default v
