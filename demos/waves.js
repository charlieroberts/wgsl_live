const v = `// drive with your mouse
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  var p : vec2f = uvN( pos.xy );
  p.y -= .5;

  var color: f32 = 0.;
  
  for( var i:f32 = 1.; i < 15.; i+= 1. ) {
    p.y += sin( (p.x / i*8.) + (p.x + (frame/((.1+mouse.x)*120.))) * i ) * mouse.y * .5; 
    color += abs( .00125 / p.y );
  }

  let out = vec4f( p.x, color, color, 1.);
  return select( 1.-out, out, mouse.z == 0. );
}
`

export default v
