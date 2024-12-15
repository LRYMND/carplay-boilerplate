import { create } from 'zustand';

// Store to easily broadcast Keystrokes from App.tsx
const KEY = create((set) => ({
  keyStroke: "",
  setKeyStroke: (key) => {
    set({ keyStroke: key });
    setTimeout(() => set({ keyStroke: "" }), 0);
  },
}));

const DEFAULT_BINDINGS = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  selectDown: 'Space',
  back: 'Backspace',
  down: 'ArrowDown',
  home: 'KeyH',
  play: 'KeyP',
  pause: 'KeyS',
  next: 'KeyN',
  prev: 'KeyV'
}

const EXTRA_CONFIG = {
  //...DEFAULT_CONFIG,
  kiosk: true,
  delay: 300,
  fps: 60,
  camera: '',
  microphone: '',
  piMost: false,
  canbus: false,
  bindings: DEFAULT_BINDINGS,
  most: {},
  canConfig: {}
}

const MMI = create<MMIStore>((set) => ({
  bindings: DEFAULT_BINDINGS,
  config: EXTRA_CONFIG,
  saveSettings: (settings) => {
    const mergedSettings: MMIConfig = {
      //...DEFAULT_CONFIG,
      ...settings,
      bindings: settings.mmi_bindings || DEFAULT_BINDINGS,
    };
    set({ settings: mergedSettings });
  },
  getSettings: () => {
  },
  stream: (stream) => {
  },
}));


const APP = create((set) => ({
  system: {
    version: '2.2.0',
    view: '',
    switch: 'ArrowUp',
    lastKey: '',
    modal: false,

    initialized: false,
    startedUp: false,

    windowSize: {
      width: 800,
      height: 480 },
    contentSize: {
      width: 800,
      height: 480
    },
    carplaySize: {
      width: 800,
      height: 460
    },

    interface: {
      dashBar: true,
      topBar: true,
      navBar: true,
      content: true,
      carplay: false
    },

    wifiState: false,
    btState: false,
    
    phoneState: false,
    carplayState: false,
    streamState: false,

    canState: false,
    linState: false,
    adcState: false,
    rtiState: false,

    textScale: 1,
  },
  settings: {},
  modules: {},
  update: (newData) =>
    set((state) => ({
      ...state,
      system: { ...state.system, ...newData.system },
      settings: { ...state.settings, ...newData.settings },
      modules: { ...state.modules, ...newData.modules }
    })),
}));


export { APP, MMI, KEY };
