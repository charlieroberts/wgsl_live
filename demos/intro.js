const v = `// PRESS CTRL+ENTER TO RELOAD SHADER
// reference at https://github.com/charlieroberts/wgsl_live
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  // get normalized texture coordinates (aka uv) in range 0-1
  let npos  = uvN( pos.xy );
  let red   = npos.x / mouse.x;
  let green = npos.y / mouse.y;
  let blue  = .5 + sin( seconds() ) * .5;
  return vec4f( red, green, blue, 1. );
}`

export default v
