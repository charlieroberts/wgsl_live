const v = `// the ability to use webcams is
// not currently available in WebGPU for Firefox

@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p = uvN( pos.xy );
  // get current frame from webcam
  let v = video( p );
  // get last frame of render
  let l = lastframe( p );
  // combine current frame and previous
  let out = v * .05 + l * .95;
  
  return vec4f( out.rgb, 1. );
}`

export default v
