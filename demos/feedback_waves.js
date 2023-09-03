const v = `// drive with your mouse
// similar to the waves demo but with
// the addition of spinning feedback
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  var p : vec2f = uvN( pos.xy );
  p.y -= .5;

  var color: f32 = 0.;
  
  for( var i:f32 = 1.; i < 15.; i+= 1. ) {
    p.y += sin( (p.x / i*8.) + (p.x + (frame/((.1+mouse.x)*120.))) * i ) * mouse.y * .5; 
    color += abs( .005 / p.y );
  }

  let last = lastframe( rotate( uvN( pos.xy ), seconds()/40. ) );
  let now = vec4f( p.x, color, color, 1.);
  let out = now * .05 + last * .95;

  return select( 1.-out, out, mouse.z == 0. );
}`

export default v

