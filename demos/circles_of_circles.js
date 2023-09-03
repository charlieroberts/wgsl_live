const v = `@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  var p : vec2f = uvN( pos.xy );
    p.x += sin( floor(seconds() * 40. )) * .25;
    p.y += cos( floor(seconds() * 40. )) * .25;

    let circles   = distance( p, vec2(.5) );
    let threshold = 1.-smoothstep( .05,.0525, circles );
    
    let feedback  = lastframe( uvN( pos.xy) );
    let out = threshold * .55 + feedback * .95;

    return vec4( out );
}`

export default v
