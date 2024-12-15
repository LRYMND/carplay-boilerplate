import { useState, useEffect } from 'react'

import { APP, MMI, KEY } from './store/Store';
import { Socket } from './socket/Socket'

import Carplay from './carplay/Carplay'

import './App.css'


function App() {
  const mmi = MMI((state) => state);
  const key = KEY((state) => state);

  const system = APP((state) => state.system)

  const [receivingVideo, setReceivingVideo] = useState(false)
  const [commandCounter, setCommandCounter] = useState(0)
  const [keyCommand, setKeyCommand] = useState('')

  useEffect(() => {
    document.addEventListener('keydown', mmiKeyDown)
    return () => {
      document.removeEventListener('keydown', mmiKeyDown)
      console.log("return")
    }
  }, []);

  const mmiKeyDown = (event: KeyboardEvent) => {
    // Store last Keystroke in store to broadcast it
    key.setKeyStroke(event.code)

    // Check if a key for switching the pages was assigned
    if (system.switch) {

      // If user is not switching the page, send control to CarPlay
      if (event.code != system.switch) {
        if (Object.values(mmi!.bindings).includes(event.code)) {
          const action = Object.keys(mmi!.bindings).find(key =>
            mmi!.bindings[key] === event.code
          )
          //console.log(action)
          if (action !== undefined) {
            setKeyCommand(action)
            setCommandCounter(prev => prev + 1)
            if (action === 'selectDown') {
              console.log('Enter')
              setTimeout(() => {
                setKeyCommand('selectUp')
                setCommandCounter(prev => prev + 1)
              }, 200)
            }
          }
        }
      }
    }
  }

  return (
    <div>
      <Socket />
      {system.startedUp ?
        <>
          {/* The carplay component should not re-render so embed it at the root of your app. */}
          <Carplay receivingVideo={receivingVideo} setReceivingVideo={setReceivingVideo} commandCounter={commandCounter} command={keyCommand} />
        </> : <></>}
    </div>
  )
}

export default App
