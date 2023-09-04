const v = `@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  var p : vec2f = fract( uvN( pos.xy )  * 4. );
  p.x += sin( floor(seconds() * 60. )) * .35;
  p.y += cos( floor(seconds() * 60. )) * .35;

  let circles   = distance( p, vec2(.5) );
  let threshold = 1.-smoothstep( .05,.0525, circles );
    
  let feedback  = lastframe( uvN( pos.xy ) * 1.00125 );
  let out = threshold * .125 + feedback * .975;

  return vec4( out.x+threshold, out.y, out.z+threshold, out.w );
}`

export default v
