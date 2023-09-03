const v = `@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  let p     = uvN( pos.xy );
  let tiled = fract( p * 10. );

  let circles   = distance( tiled, vec2(.5) );
  let threshold = smoothstep( .25,.275, circles );

  return vec4f( 1. - threshold );
}`

export default v
