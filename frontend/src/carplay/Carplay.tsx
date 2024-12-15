/* eslint-disable no-case-declarations */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { findDevice, requestDevice, CommandMapping, } from 'node-carplay/web'

import { CarPlayWorker } from './worker/types'
import useCarplayAudio from './useCarplayAudio'
import { useCarplayTouch } from './useCarplayTouch'
import { InitEvent } from './worker/render/RenderEvents'

import { RotatingLines } from 'react-loader-spinner'
import { APP, MMI } from './../store/Store';

const videoChannel = new MessageChannel()
const micChannel = new MessageChannel()

const RETRY_DELAY_MS = 30000

interface CarplayProps {
  command: string,
  commandCounter: number
}

function Carplay({ command, commandCounter }: CarplayProps) {

  const app = APP((state) => state);
  const mmi = MMI((state) => state);

  const width = app.system.carplaySize.width
  const height = app.system.carplaySize.height

  const config = {
    fps: mmi.config.fps,
    width: width,
    height: height,
    mediaDelay: mmi.config.delay
  }

  const [isPlugged, setIsPlugged] = useState(false)
  const [deviceFound, setDeviceFound] = useState<Boolean | null>(false)

  const mainElem = useRef<HTMLDivElement>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(
    null,
  )

  const renderWorker = useMemo(() => {
    if (!canvasElement) return

    const worker = new Worker(
      new URL('./worker/render/Render.worker.ts', import.meta.url), { type: 'module' },
    )
    const canvas = canvasElement.transferControlToOffscreen()
    worker.postMessage(new InitEvent(canvas, videoChannel.port2), [
      canvas,
      videoChannel.port2,
    ])
    return worker
  }, [canvasElement])

  useLayoutEffect(() => {
    if (canvasRef.current) {
      setCanvasElement(canvasRef.current)
    }
  }, [])

  const carplayWorker = useMemo(() => {
    const worker = new Worker(
      new URL('./worker/CarPlay.worker.ts', import.meta.url), { type: 'module' }
    ) as CarPlayWorker
    const payload = {
      videoPort: videoChannel.port1,
      microphonePort: micChannel.port1,
    }
    worker.postMessage({ type: 'initialise', payload }, [
      videoChannel.port1,
      micChannel.port1,
    ])
    return worker
  }, [])

  const { processAudio, getAudioPlayer, startRecording, stopRecording } =
    useCarplayAudio(carplayWorker, micChannel.port2)

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  // subscribe to worker messages
  useEffect(() => {
    carplayWorker.onmessage = ev => {
      const { type } = ev.data
      switch (type) {
        case 'plugged':
          setIsPlugged(true)
          app.update({system : { phoneState: true }})
          break
        case 'unplugged':
          setIsPlugged(false)
          app.update({system: { phoneState: false }})
          app.update({system: { carplayState: false }})
          break
        case 'requestBuffer':
          clearRetryTimeout()
          getAudioPlayer(ev.data.message)
          break
        case 'audio':
          clearRetryTimeout()
          processAudio(ev.data.message)
          break
        case 'media':
          //TODO: implement
          break
        case 'command':
          const {
            message: { value },
          } = ev.data
          switch (value) {
            case CommandMapping.startRecordAudio:
              startRecording()
              break
            case CommandMapping.stopRecordAudio:
              stopRecording()
              break
            case CommandMapping.requestHostUI:
              app.update({system: { view: "Dashboard" }})
          }
          break
        case 'failure':
          if (retryTimeoutRef.current == null) {
            console.error(
              `Carplay initialization failed -- Reloading page in ${RETRY_DELAY_MS}ms`,
            )
            retryTimeoutRef.current = setTimeout(() => {
              window.location.reload()
            }, RETRY_DELAY_MS)
          }
          break
      }
    }
  }, [carplayWorker, clearRetryTimeout, getAudioPlayer, processAudio, renderWorker, startRecording, stopRecording])

  useEffect(() => {
    const element = mainElem?.current
    if (!element) return;
    const observer = new ResizeObserver(() => {
      //console.log("size change")
      carplayWorker.postMessage({ type: 'frame' })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, []);

  useEffect(() => {
    carplayWorker.postMessage({ type: 'keyCommand', command: command })
  }, [commandCounter]);

  const checkDevice = useCallback(
    async (request: boolean = false) => {
      const device = request ? await requestDevice() : await findDevice()
      if (device) {
        console.log('starting in check')
        setDeviceFound(true)
        app.update({system: {streamState: true }})
        carplayWorker.postMessage({ type: 'start', payload: { config } })
      } else {
        setDeviceFound(false)
      }
    },
    [carplayWorker]
  )

  // usb connect/disconnect handling and device check
  useEffect(() => {
    navigator.usb.onconnect = async () => {
      checkDevice()
    }

    navigator.usb.ondisconnect = async () => {
      const device = await findDevice()
      if (!device) {
        carplayWorker.postMessage({ type: 'stop' })
        setDeviceFound(false)
      }
    }

    //checkDevice()
  }, [carplayWorker, checkDevice])

  const onClick = useCallback(() => {
    checkDevice(true)
  }, [checkDevice])

  const sendTouchEvent = useCarplayTouch(carplayWorker, width, height)

  const isLoading = !isPlugged

  useEffect(() => {
    console.log("Phone connected? ", isPlugged)
  }, [isPlugged])

  return (
    <div
      style={{ height: '100%', width: '100%', touchAction: 'none', overflow: 'hidden'}}
      id={'main'}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'black',
          }}
        >
          {deviceFound === false && (

            <div style={{
              color: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{display: 'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                <h3>Connect phone or click to pair dongle.</h3>
                <p/>
                <button onClick={onClick} style={{background:'black', border:'0'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="nav-icon" height={"25px"} width={"100px"} fill={'white'}>
                    <use xlinkHref="/assets/svg/link.svg#link"></use>
                  </svg>
                </button>
              </div>

            </div>
          )}
          {deviceFound === true && (
            <RotatingLines
              strokeColor="grey"
              strokeWidth="5"
              animationDuration="0.75"
              width="96"
              visible={true}
            />
          )}
        </div>
      )}
      <div
        id="videoContainer"
        onPointerDown={sendTouchEvent}
        onPointerMove={sendTouchEvent}
        onPointerUp={sendTouchEvent}
        onPointerCancel={sendTouchEvent}
        onPointerOut={sendTouchEvent}
        style={{
          height: '100%',
          width: '100%',
          padding: 0,
          margin: 0,
          display: 'flex',
        }}
      >
        <canvas
          ref={canvasRef}
          id="video"
          style={
            isPlugged && app.system.view === "Carplay"
              ? { height: '100%', overflow: 'hidden'}
              : { display: 'none' }
          }
        />
      </div>
    </div>
  )
}

export default Carplay