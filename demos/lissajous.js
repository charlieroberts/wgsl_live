const v = `@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
	// play with these values
  let gain = .25;
  let freq = 4.3;
  let freqMod = 1.333 + cos(seconds()*.25) * .15;
  let gainMod = 1.25 + sin(seconds() * .325) * .5;
  
  var p : vec2f = uvN( pos.xy );
  p.x += sin( seconds() * freq  ) * gain;
  p.y += cos( seconds() * freq * freqMod ) * gain * gainMod;

  let circles   = distance( p, vec2(.5) );
  let threshold = 1. - smoothstep( .01,.015, circles );
  let colorthreshold = select( 
    vec3( threshold ),
    threshold + vec3( sin(seconds()), cos(seconds()), 0. ), 
    threshold > .01 
  );

  // feedback fade towards cetner
  var _uv : vec2f = uvN( pos.xy );
  _uv += (_uv - vec2f(.5) ) * .005;
  
  let feedback = lastframe( _uv  );
  let out = colorthreshold * .55 + feedback.rgb * .98;
  
  return vec4( out, 1. );
} 
`

export default v
