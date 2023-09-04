import { default as seagulls } from './seagulls.js'
import { basicSetup, EditorView } from "codemirror"
import { keymap } from "@codemirror/view"
import { wgsl } from "@iizukak/codemirror-lang-wgsl"
import { Prec } from "@codemirror/state"
import { defaultKeymap } from "@codemirror/commands";
import { default as Audio } from "./audio.js"
import { default as noise } from "./noise.js"
import { default as constants } from "./constants.js"
import { default as functions } from "./functions.js"
import { default as Video } from "./video.js"
import { basicDark } from 'cm6-theme-basic-dark'
import { default as Demos } from './demos.js'


const shaderDefault = Demos.files.introduction

const shaderInit = function( frag=null ) {
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

  let __constants = constants
  if( navigator.userAgent.indexOf('Firefox') === -1 && Video.hasPermissions ) {
    frag_start += `@group(1) @binding(0) var videoBuffer:    texture_external;\n`
    __constants += `fn video( pos : vec2f ) -> vec4f {
    return textureSampleBaseClampToEdge( videoBuffer, videoSampler, pos );
  }\n`
  }else{
    __constants += `fn video( pos : vec2f ) -> vec4f {
  return vec4f( 0. );
}\n`
  }
  frag_start += noise

  const s =  vertex + frag_start + __constants + functions + ( frag===null ? shaderDefault : frag )
  return s
}

const init = async function() {
  let hasVideoPermissions = false
  // don't start video element if using Firefox
  if( navigator.userAgent.indexOf( 'Firefox' ) === -1 ) {
    hasVideoPermissions = await Video.init()
  }
  
  let src = localStorage.getItem("src")
  src = src == null ? shaderDefault : src

  const shader = shaderInit( src )
  setupEditor()
  setupMouse()
  document.getElementById('audio').onclick = e => Audio.start()
  Demos.init( editor, shaderInit, runGraphics )
  await runGraphics( shader )
}

window.onload = init

async function runGraphics( code = null ) {
  let frame = 0

  const sg = await seagulls.init()

  sg.uniforms({ 
    frame,
    res:[window.innerWidth, window.innerHeight],
    audio:[0,0,0],
    mouse:[0,0,0]
  })
  .onframe( ()=> {
    sg.uniforms.frame = frame++
    sg.uniforms.audio = [ Audio.low, Audio.mid, Audio.high ]
    sg.uniforms.mouse = [ mousex, mousey, mouseclick ]
  })

  if( navigator.userAgent.indexOf('Firefox') === -1 ) { // && Video.hasPermissions ) {
    sg.textures([ Video.element ])
  }
  
  sg.render( code, { uniforms:['frame','res', 'audio', 'mouse'] })
    .run()
}

const setupEditor = function() {
  const p = Prec.highest(
    keymap.of([
      { 
        key: "Ctrl-Enter", 
        run(e) { 
          localStorage.setItem("src", e.state.doc.toString())
          runGraphics( shaderInit( e.state.doc.toString() ) );
          return true
        } 
      }
    ])
  );

  let src = localStorage.getItem("src")
  src = src == null ? shaderDefault : src

  window.editor = new EditorView({
    doc: src,
    extensions: [
      basicSetup, 
      wgsl(),
      p,
      basicDark
    ],
    parent: document.body,
  });

  editor.focus();
};

let mousex = 0, mousey = 0, mouseclick = 0
const setupMouse = function() {
  window.onmousemove = e => {
    mousex = e.pageX / window.innerWidth
    mousey = e.pageY / window.innerHeight
  }

  document.body.onmousedown = e => mouseclick = 1
  document.body.onmouseup   = e => mouseclick = 0
}
