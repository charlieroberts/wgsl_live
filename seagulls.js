const CONSTANTS = {
  quadVertices: new Float32Array([
    -1,-1,
    1,-1,
    1,1,
    -1,-1,
    1,1,
    -1,1
  ]),

  defaultStorageFlags : GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,

  workgroupSize: 8
}

// to "fix" inconsistencies with device.writeBuffer
const mult = navigator.userAgent.indexOf('Chrome') === -1 ? 4 : 1

let backTexture = null
const seagulls = {
  CONSTANTS,

  async getDevice() {
    const adapter = await navigator.gpu?.requestAdapter()
    const device = await adapter?.requestDevice()

    if (!device) {
      console.error('need a browser that supports WebGPU')
      return
    }

    return device
  },
  
  setupCanvas( device=null, canvas=null ) {
    if( canvas === null ) canvas = document.getElementsByTagName('canvas')[0]
    if( canvas === null ) {
      console.error('could not find canvas to initialize seagulls')
      return
    }

    const context = canvas.getContext('webgpu'),
          format  = navigator.gpu.getPreferredCanvasFormat()

    context.configure({
      device,
      format,
      alphaMode:'premultiplied',
      usage:GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    })

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    backTexture = seagulls.createTexture( device, format, canvas )

    return [ canvas, context, format ]
  },

  createTexture( device, format, canvas ) {
    const tex = device.createTexture({
      size: [canvas.width, canvas.height],
      format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    })

    return tex
  },
 
  createQuadBuffer( device, label='quad vertices' ) {
    const buffer = device.createBuffer({
      label,
      size:  CONSTANTS.quadVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer( buffer, 0, CONSTANTS.quadVertices )
    
    const vertexBufferLayout = {
      arrayStride: 8,
      attributes: [{
        format: "float32x2",
        offset: 0,
        shaderLocation: 0, 
      }],
    }

    return [buffer, vertexBufferLayout]
  },


  createStorageBuffer( device=null, storage=null, label='storage', usage=CONSTANTS.defaultStorageFlags, offset=0 ) {
    const buffer = device.createBuffer({
      label,
      usage,
      size: storage.byteLength,
    })

    device.queue.writeBuffer( buffer, offset, storage )

    return buffer
  },

  _createPingPongLayout( device, label='ping-pong', uniformCount=0, bufferCount=0 ) {
    const entries = []

    // very unoptimized... every buffer has max visibility
    // and every buffer is read/write storage
    for( let i = 0; i < bufferCount; i++ ) {
      const even = i % 2 === 0
      const entry = { binding: i }
      entry.visibility = even 
        ? GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT
        : GPUShaderStage.COMPUTE
      entry.buffer = { type: even ? 'storage' : 'storage' }
      entries.push( entry )
    }

    if( uniformCount !==0 ) {
      entries.forEach( e => {
        e.binding += uniformCount 
      })
      for( let i = 0; i < uniformCount; i++ ) {
        entries.unshift({
          binding:i,
          visibility: GPUShaderStage.COMPUTE
        })
      }
    }
    const bindGroupLayout = device.createBindGroupLayout({
      label,
      entries
    })


    return bindGroupLayout
  },


  createRenderLayout( device, label='render', shouldAddBuffer=1, uniforms=null, backBuffer=true, textures=null ) {
    let count = 0
    const entries = []

    if( uniforms !== null ) {
      for( let key of Object.keys( Object.getOwnPropertyDescriptors( uniforms ) ) ) {
        entries.push({
          binding:  count++,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer: { type:'uniform' }
        })
      }
    }

    if( backBuffer ) {
      entries.push({
        binding:count++,
        visibility: GPUShaderStage.FRAGMENT,
        sampler: {}
      })
      entries.push({
        binding:count++,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {}
      })
    }

    if( textures !== null ) {
      textures.forEach( tex => {
        entries.push({
          binding:count++,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {}
        })
        //entries.push({
        //  binding:count++,
        //  visibility: GPUShaderStage.FRAGMENT,
        //  externalTexture: {}
        //})
      })
    }

    if( shouldAddBuffer ) {
      for( let i = 0; i < shouldAddBuffer; i++ ) {
        entries.push({
          binding: count++,
          visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage"} 
        })
      }
    }

    const bindGroupLayout = device.createBindGroupLayout({
      label,
      entries
    })


    return bindGroupLayout
  },


  createUniformBuffer( device, values, label='seagull uniforms' ) {
    const arr = new Float32Array(values)

    const buff = device.createBuffer({
      label: label + (Math.round( Math.random() * 100000 )),
      size:  arr.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    device.queue.writeBuffer( buff, 0, arr )

    return buff
  },

  _createPingPongBindGroups( device, layout, buffers, uniform=null, name='pingpong', backBuffer=true, textures=null ) {
    const entriesA = [],
          entriesB = []

    let count = 0 

    if( uniform !== null ) {
      for( let key of Object.keys( Object.getOwnPropertyDescriptors( uniform ) ) ) {
        const uni = {
          binding:  count++,
          resource: { buffer: uniform[ key ] }
        }
        entriesA.push( uni )
        entriesB.push( uni )
      }
    }

    if( backBuffer ) {
      const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
      })
      const sampleruni = {
        binding: count++,
        resource: sampler,
      }
      const textureuni = {
        binding: count++,
        resource: backTexture.createView(),
      }

      entriesA.push( sampleruni )
      entriesB.push( sampleruni )
      entriesA.push( textureuni )
      entriesB.push( textureuni )
    }

    
    if( textures !== null ) {
      textures.forEach( tex => {
        const sampler = device.createSampler({
          magFilter: 'linear',
          minFilter: 'linear'
        })
        const sampleruni = {
          binding: count++,
          resource: sampler
        }
        //const textureuni = {
        //  binding: count++,
        //  resource: device.importExternalTexture({ source:tex.src })
        //}

        entriesA.push( sampleruni )
        entriesB.push( sampleruni )
      })
    }


    if( buffers !== null ) {
      // for each buffer, if it is a pingpong we need
      // to create an extra entry for it, if it's not
      // a pingpong than the single entry is sufficient.
      // either way, the buffer needs to go into two different
      // bindgroups fed by entriesA and entriesB.
      for( let i = 0; i < buffers.length; i++ ) {
        let buffer = buffers[ i ]

        entriesA.push({
          binding:count,
          resource: { buffer:buffers[i]}
        })

        if( buffer.pingpong === true ) {
          entriesA.push({
            binding:count + 1,
            resource: { buffer:buffers[i+1]}
          })

          entriesB.push({
            binding:count,
            resource: { buffer:buffers[i+1]}
          })
          entriesB.push({
            binding:count + 1,
            resource: { buffer:buffers[i]}
          })

          i+=1 // extra advance!!!!
          count += 2
        }else{
          entriesB.push({
            binding:count,
            resource: { buffer:buffers[i]}
          })
          count += 1
        }
      }
    }

    const bindGroups = [
      device.createBindGroup({
        label:`${name} a`,
        layout,
        entries:entriesA
      }),

      device.createBindGroup({
        label:`${name} b`,
        layout,
        entries: entriesB      
      })
    ]

    return bindGroups
  },
  createRenderPipeline( device, code, presentationFormat, vertexBufferLayout, bindGroupLayout, textures ) {
    const module = device.createShaderModule({
      label: 'main render',
      code
    })

    const bindGroupLayouts = [ bindGroupLayout ]
    const hasTexture = Array.isArray( textures ) 
      ? textures[0] !== null 
      : false

    if( navigator.userAgent.indexOf('Firefox') === -1 && hasTexture ) {
      const externalEntry = {
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture:{}
      }

      const externalLayout = device.createBindGroupLayout({
        label:'external layout',
        entries:[ externalEntry ]
      })

      bindGroupLayouts.push( externalLayout )
    }

    const pipelineLayout = device.createPipelineLayout({
      label: "render pipeline layout",
      bindGroupLayouts
    })

    const pipeline = device.createRenderPipeline({
      label: "render pipeline",
      layout:pipelineLayout,
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [vertexBufferLayout]
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{
          format: presentationFormat,
          /*blend:{
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'zero',
              dstFactor: 'one',
              operation: 'add',
            }
          }*/
        }]
      }
    });

    return pipeline
  },

  createSimulationPipeline( device, pingponglayout, code ) {
    const layout = device.createPipelineLayout({
      label:'cell pipeline layout',
      bindGroupLayouts: [ pingponglayout ]
    })

    const module = device.createShaderModule({
      label: 'sim',
      code
    })

    const p = device.createComputePipeline({
      label: 'sim',
      layout,
      compute: {
        module,
        entryPoint: 'cs'
      }
    })

    return p
  },

  createRenderStage( device, shader, storage=null, presentationFormat, uniforms=null, textures=null ) {
    const [quadBuffer, quadBufferLayout] = seagulls.createQuadBuffer( device )
    //console.log( storage, Object.keys( storage ) )n
    const storageLength = storage === null ? 0 : Object.keys(storage).length

    const renderLayout  = seagulls.createRenderLayout( device, 'seagull layout', storageLength, uniforms, true, textures )
    const bindGroups    = seagulls._createPingPongBindGroups( 
      device, 
      renderLayout, 
      storage, 
      uniforms, 
      'render', 
      true, 
      textures
    )

    const pipeline  = seagulls.createRenderPipeline( device, shader, presentationFormat, quadBufferLayout, renderLayout, textures )

    return [ pipeline, bindGroups, quadBuffer ]
  },

  createSimulationStage( device, computeShader, buffers=null, uniforms=null ) {
    const uniformsLength = uniforms === null 
      ? 0 
      : Object.keys( Object.getOwnPropertyDescriptors( uniforms ) ).length

    const pingPongLayout     = seagulls._createPingPongLayout( device, 'ping', uniformsLength, buffers.length )
    const pingPongBindGroups = seagulls._createPingPongBindGroups( device, pingPongLayout, buffers, uniforms )
    const simPipeline        = seagulls.createSimulationPipeline( device, pingPongLayout, computeShader )

    return [ simPipeline, pingPongBindGroups ]
  },

  pingpong( encoder, pipeline, bindgroups, length=1, workgroupCount, idx=0 ) {
    for( let i = 0; i < length; i++ ) {
      const computePass = encoder.beginComputePass()

      computePass.setPipeline( pipeline )
      computePass.setBindGroup( 0, bindgroups[ idx%2 ] ) 

      if( Array.isArray( workgroupCount ) ) {
        computePass.dispatchWorkgroups( workgroupCount[0], workgroupCount[1], workgroupCount[2] )
      }else{
        computePass.dispatchWorkgroups( workgroupCount,workgroupCount,1 )
      }

      idx++
      computePass.end()
    }
    
    return idx
  },

  //render( device, encoder, view, clearValue, vertexBuffer, pipeline, bindGroups, count=1,idx=0 ) {
  //  const pass = encoder.beginRenderPass({
  //    label: 'render',
  //    colorAttachments: [{
  //      view,
  //      clearValue,
  //      loadOp:  'clear',
  //      storeOp: 'store',
  //    }]
  //  })
  //  pass.setPipeline( pipeline )
  //  pass.setVertexBuffer( 0, vertexBuffer )
  //  pass.setBindGroup( 0, bindGroups[ idx++%2 ]  )
  //  pass.draw(6, count)  
  //  pass.end()
  //  device.queue.submit([ encoder.finish() ])
  //  return idx
  //},

  render( device, encoder, view, clearValue, vertexBuffer, pipeline, bindGroups, count=1, idx=0, context=null, textures=null ) {
    const shouldCopy = context !== null

    const renderPassDescriptor = {
      label: 'render',
      colorAttachments: [{
        view,
        clearValue,
        loadOp:  'clear',
        storeOp: 'store',
      }]
    }

    const externalLayout = device.createBindGroupLayout({
      label:'external layout',
      entries:[{
        binding:0,
        visibility: GPUShaderStage.FRAGMENT,
        externalTexture: {}
      }]
    })
    
    let resource = null, 
        shouldBind = navigator.userAgent.indexOf('Firefox') === -1 && textures[0] !== null 

    
    let externalTextureBindGroup = null

    if( shouldBind )  {
      try {
        resource = device.importExternalTexture({
          source:textures[0]
        })

        externalTextureBindGroup = device.createBindGroup({
          layout: externalLayout,
          entries: [{
            binding: 0,
            resource
          }]
        }) 
      }catch( e ) {
        console.log( e )
        shouldBind = false
      }
    }

    // additional setup.

    // in case we want a backbuffer etc. eventually this should probably be
    // replaced with a more generic post-processing setup
    let swapChainTexture = null
    if( shouldCopy ) {
      swapChainTexture = context.getCurrentTexture()
      renderPassDescriptor.colorAttachments[0].view = swapChainTexture.createView()
    }

    const pass = encoder.beginRenderPass( renderPassDescriptor )
    pass.setPipeline( pipeline )
    pass.setVertexBuffer( 0, vertexBuffer )
    pass.setBindGroup( 0, bindGroups[ idx++ % 2 ] )
    if( shouldBind ) { 
      pass.setBindGroup( 1, externalTextureBindGroup ) 
    }
    pass.draw(6, count)  
    pass.end()

    if( shouldCopy ) {
      // Copy the rendering results from the swapchain into |backTexture|.
      encoder.copyTextureToTexture(
        {
          texture: swapChainTexture,
        },
        {
          texture: backTexture,
        },
        [context.canvas.width, context.canvas.height]
      )
    }

    device.queue.submit([ encoder.finish() ])

    return idx
  },

  createUniformsManager( device, dict ) {
    const manager = {}
    const values  = Object.values( dict )
    const keys    = Object.keys( dict )

    keys.forEach( (k,i) => {
      const __value = values[ i ]
      const value = Array.isArray( __value ) ? __value : [ __value ]
      const buffer = seagulls.createUniformBuffer( device, value )
      const storage = new Float32Array( value )


      if( Array.isArray( __value ) ) {
        manager[ k ] = buffer
        for( let i = 0; i < value.length; i++ ) {
          Object.defineProperty( buffer, i, {
            set(v) {
              storage[ i ] = v
              device.queue.writeBuffer( buffer, i*4, storage, i*4, mult )
            },
            get() {
              return storage[ i ]
            }
          })
        }
        Object.defineProperty( manager, k, {
          set(v) {
            storage.set( v )
            // apparently docs are wrong, all arguments are actually in bytes wtf
            // https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer
            device.queue.writeBuffer( buffer, 0, storage, 0, v.length * mult )
          },

          get() {
            return buffer
          }
        })
      }else{
        Object.defineProperty( manager, k, {
          set( v ) {
            storage[ 0 ] = v
            device.queue.writeBuffer( buffer, 0, storage, 0, mult )
          },
          get() {
            return buffer
          }
        })
      }
    })

    return manager
  },

  async init( ) {
    const device = await seagulls.getDevice()

    const [canvas, context, presentationFormat] = seagulls.setupCanvas( device )
    const view = context.getCurrentTexture().createView()

    const instance = Object.create( seagulls.proto )
    Object.assign( instance, { 
      canvas, 
      context, 
      presentationFormat, 
      view, 
      device, 
      computeStep:0,
      renderStep: 0,
      frame:      0,
      times:      1,
      clearColor: [0,0,0,1],
      __computeStages: [],
      __textures:null
    })

    return instance
  },

  proto: {
    buffers( _buffers ) {
      this.__buffers = {}
      Object.entries(_buffers).forEach( ([k,v]) => {
        const usage = v.usage !== undefined ? v.usage : CONSTANTS.defaultStorageFlags
        this.__buffers[ k ] = seagulls.createStorageBuffer( this.device, v, 'k', usage )
      })
      return this
    },

    uniforms( _uniforms ) {
      this.uniforms = seagulls.createUniformsManager( this.device, _uniforms )
      return this
    },

    textures( _textures ) {
      this.__textures = _textures/*textures.map( tex => {
        const t = seagulls.createTexture( this.device, this.presentationFormat, this.canvas )
        t.src = tex
        return t
      })*/

      return this
    },

    clear( clearColor ) {
      this.clearColor = clearColor 
      return this
    },

    compute( shader, args ) {
      let __uniforms = null
      if( args?.uniforms !== undefined ) {
        __uniforms = {}
        for( let u of args.uniforms ) {
          __uniforms[ u ] = this.uniforms[ u ]
        }
      }

      if( Array.isArray( args?.pingpong ) ) {
        args.pingpong.forEach( key => {
          this.__buffers[ key ].pingpong = true
        })
      } 

      const [ simPipeline, simBindGroups ] = seagulls.createSimulationStage( 
        this.device, 
        shader, 
        Object.values( this.__buffers ), 
        __uniforms
      )

      if( args?.workgroupCount !== undefined ) {
        this.workgroupCount = args.workgroupCount
      }else{
        this.workgroupCount = 128//Math.round(this.canvas.width / 8)
      }

      this.__computeStages.push({ 
        simPipeline, simBindGroups, step:0, times:1, workgroupCount:this.workgroupCount  
      })

      Object.assign( this, { simPipeline, simBindGroups })
      return this
    },

    pingpong( times ) {
      this.times = times
      return this
    },

    render( shader, args ) {
      let __uniforms = null
      if( args?.uniforms !== undefined ) {
        __uniforms = {}
        for( let u of args.uniforms ) {
          __uniforms[ u ] = this.uniforms[ u ]
        }
      }
      if( Array.isArray( args?.pingpong ) ) {
        args.pingpong.forEach( key => {
          this.__buffers[ key ].pingpong = true
        })
      }
      const [ renderPipeline, renderBindGroups, quadBuffer ] = seagulls.createRenderStage( 
        this.device, 
        shader, 
        this.__buffers !== undefined ? Object.values(this.__buffers) : null, 
        this.presentationFormat,
        __uniforms,
        this.__textures
      )

      Object.assign( this, { renderPipeline, renderBindGroups, quadBuffer })
      return this
    },

    onframe( fnc ) {
      this.__onframe = fnc 
      return this
    },

    run( instanceCount = 1, time=null ) {
      const encoder = this.device.createCommandEncoder({ label: 'seagulls encoder' })

      if( typeof this.__onframe === 'function' ) this.__onframe()

      if( this.__computeStages.length > 0 ) {
        for( let stage of this.__computeStages ) {
          stage.step = seagulls.pingpong( 
            encoder, 
            stage.simPipeline, 
            stage.simBindGroups, 
            stage.times, //this.times, 
            stage.workgroupCount, 
            stage.step
          )
        }
      }

      this.renderStep = seagulls.render( 
        this.device, 
        encoder, 
        this.view,
        this.clearColor, 
        this.quadBuffer, 
        this.renderPipeline, 
        this.renderBindGroups,
        instanceCount,
        this.renderStep,
        this.context,
        this.__textures
      )

      if( time === null ) {
        window.requestAnimationFrame( ()=> { this.run( instanceCount ) })
      }else{
        this.timeout = setTimeout( ()=> { this.run( instanceCount, time ) }, time )
      }
    }
  }
}

export default seagulls
