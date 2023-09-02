import { default as seagulls } from './seagulls.js'
import { basicSetup, EditorView } from "codemirror"
import { keymap } from "@codemirror/view"
import { wgsl } from "@iizukak/codemirror-lang-wgsl"
import { Prec } from "@codemirror/state"
import { defaultKeymap } from "@codemirror/commands";
import { default as Audio } from "./audio.js"
import { default as noise } from "./noise.js"
import { default as constants } from "./constants.js"
import { default as Video } from "./video.js"
import { basicDark } from 'cm6-theme-basic-dark'

const vertex = `
@vertex 
fn vs( @location(0) input : vec2f ) ->  @builtin(position) vec4f {
  return vec4f( input, 0., 1.); 
}
`

let frag_start = `@group(0) @binding(0) var<uniform> frame: f32;
@group(0) @binding(1) var<uniform> res:   vec2f;
@group(0) @binding(2) var<uniform> audio: vec3f;
@group(0) @binding(3) var<uniform> mouse: vec3f;
@group(0) @binding(4) var backSampler:    sampler;
@group(0) @binding(5) var backBuffer:     texture_2d<f32>;
@group(0) @binding(6) var videoSampler:   sampler;
`
if( navigator.userAgent.indexOf('Firefox') === -1 ) {
frag_start += `@group(1) @binding(0) var videoBuffer:    texture_external;\n`
}
frag_start += noise
frag_start += constants

const shader = `// PRESS CTRL+ENTER TO RELOAD SHADER
// reference at https://github.com/charlieroberts/wgsl_live
@fragment 
fn fs( @builtin(position) pos : vec4f ) -> @location(0) vec4f {
  // create normalized position coordinates in range 0-1
  let npos  = pos.xy / res;
  let red   = npos.x / mouse.x;
  let green = npos.y / mouse.y;
  let blue  = .5 + sin( frame / 60. ) * .5;
  return vec4f( red, green, blue, 1. );
}`

const init = async function() {
  await Video.start()
  setupEditor()
  setupMouse()
  document.getElementById('audio').onclick = e => Audio.start()
  await runGraphics()
}

window.onload = init

async function runGraphics( code = null) {
  let frame = 0
  code = code === null ? frag_start + shader : frag_start + code

  code = vertex + code 

  const sg = await seagulls.init()

  sg.uniforms({ 
    frame,
    res:[window.innerWidth, window.innerHeight],
    audio:[0,0,0],
    mouse:[0,0,0]
  })
  .textures([ Video.element ])
  .onframe( ()=> {
    sg.uniforms.frame = frame++
    sg.uniforms.audio = [ Audio.low, Audio.mid, Audio.high ]
    sg.uniforms.mouse = [ mousex, mousey, mouseclick ]
  })
  .render( code, { uniforms:['frame','res', 'audio', 'mouse'] })
  .run()
}

const setupEditor = function() {
  const p = Prec.highest(
    keymap.of([
      { 
        key: "Ctrl-Enter", 
        run(e) { 
          runGraphics( e.state.doc.toString() )
          return true
        } 
      }
    ])
  )

  window.editor = new EditorView({
    doc: shader,
    extensions: [
      basicSetup, 
      wgsl(),
      p,
      basicDark
    ],
    parent: document.body,
  })

  editor.focus()
}

let mousex = 0, mousey = 0, mouseclick = 0
const setupMouse = function() {
  window.onmousemove = e => {
    mousex = e.pageX / window.innerWidth
    mousey = e.pageY / window.innerHeight
  }

  document.body.onmousedown = e => mouseclick = 1
  document.body.onmouseup   = e => mouseclick = 0
}
