import { default as introduction } from './demos/intro.js' 
import { default as waves } from './demos/waves.js'
import { default as feedback } from './demos/simple_feedback.js'

const Demos = {
  files: {
    introduction,
    waves,
    ['simple feedback']: feedback
  },
  init( cm, build, run ) {
    const sel = document.getElementById( 'demo' )
    const demoGroup = document.createElement('optgroup')
    demoGroup.setAttribute( 'label', '----- demos -----' )

    for( let key in Demos.files ) {
      const opt = document.createElement( 'option' )
      opt.innerText = key

      demoGroup.appendChild( opt )
    }
    sel.appendChild( demoGroup )

    sel.onchange = e => {
      const code = Demos.files[ e.target.selectedOptions[0].innerText ]

      run( build( code ) )

      cm.dispatch({
        changes: { from: 0, to: cm.state.doc.length, insert: code }
      })
    }
  }
}

export default Demos
