import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { APP } from '../store/Store';

// Define all modules for easy iteration and reference
const modules = {
  app: APP,
  //mmi: MMI, // Uncomment if needed
};

// Create socket connections for each module
const socket = {};
Object.keys(modules).forEach(module => {
  socket[module] = io(`ws://localhost:4001/${module}`);
});

export const Socket = () => {

  // Initialize all Zustand stores and map them to module names
  const store = Object.fromEntries(
    Object.entries(modules).map(([key, useStore]) => [key, useStore()])
  );

  // Track the total number of modules
  const totalModules = Object.keys(modules).length;

  // State to track how many modules have fully loaded
  const [loadedModules, setLoadedModules] = useState(0);

  // Ref to store a Set of loaded modules, preventing duplicate entries and helping to manage loading state
  const loadedModuleSet = useRef(new Set());

  /* Handle Window Resize */
  useEffect(() => {
    const handleResize = () => {
      //console.log(window.innerWidth, window.innerHeight);
      if (store['app'].system.initialized) {
        const topBar = store['app'].settings.side_bars.topBarHeight.value;
        const navBar = store['app'].settings.side_bars.navBarHeight.value;
        const dashBar = store['app'].settings.side_bars.dashBar.value ? topBar : 0;

        const newContentSize = { width: window.innerWidth, height: (window.innerHeight - (topBar + navBar)) };
        const newCarplaySize = { width: window.innerWidth, height: (window.innerHeight - dashBar) };

        store['app'].update({
          system: {
            startedUp: true,
            contentSize: newContentSize,
            carplaySize: newCarplaySize,
            windowSize: { width: window.innerWidth, height: window.innerHeight },
          }
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [store['app'].system.initialized]);

  /* Handle Text Resize */
  useEffect(() => {
    if (store['app'].system.initialized) {
      const multiplier = {
        Small: 0.75,
        Default: 1,
        Large: 1.25,
      };
      const textSize = store['app'].settings.general.textSize.value;
      const textScale = multiplier[textSize] ?? 1;
      store['app'].update({ system: { textScale: textScale } });
    }
  }, [store['app'].system.initialized, store['app'].settings.general]);

  /* Handle Interface Visibility */
  useEffect(() => {
    if (store['app'].system.phoneState && (store['app'].system.view === 'Carplay') && store.app != null) {
      store['app'].update({ system: { interface: { topBar: false, navBar: false } } });
      if (store['app'].settings.side_bars.dashBar.value) {
        store['app'].update({ system: { interface: { dashBar: true } } });
      }
    } else {
      store['app'].update({ system: { interface: { dashBar: false, topBar: true, navBar: true, content: true, carplay: false } } });
    }
  }, [store['app'].system.view, store['app'].system.phoneState]);

  /* Initialize App */
  useEffect(() => {
    console.log("checking for modules");

    // When loadedModules matches totalModules, all modules have been initialized
    if (loadedModules === totalModules) {
      console.log("modules loaded");
      store['app'].update({ modules: modules });
      store['app'].update({ system: { initialized: true } });
      store['app'].update({ system: { view: store['app'].settings.general.startPage.value}})
    }
  }, [loadedModules]);

  /* Wait for Settings */
  useEffect(() => {
    // Handles settings update for each module, ensuring each module loads once
    const handleSettings = (module) => (data) => {      
      // Add the module to the loaded set
      loadedModuleSet.current.add(module);

      // Update the loadedModules state based on the set size, ensuring accurate count
      setLoadedModules(loadedModuleSet.current.size);
      
      // Update the store with the new settings data
      store[module].update({ settings: data });
    };

    // Handles state updates for each module
    const handleState = (module) => (data) => {
      store['app'].update({ system: { [module + "State"]: data } });
      console.log("handling state, ", module, data);
    };

    // Register state and settings listeners for each module
    Object.keys(modules).forEach(module => {
      if (module !== 'mmi') {
        socket[module].on('state', handleState(module));
        socket[module].emit('ping');
      }
    });

    // Load settings for each module
    Object.keys(modules).forEach(module => {
      socket[module].on('settings', handleSettings(module));
      socket[module].emit('load');
    });

    // Clean up listeners on component unmount
    return () => {
      Object.keys(modules).forEach(module => {
        socket[module].off('settings', handleSettings(module));
        socket[module].off('state', handleState(module));
      });
    };
  }, []);

  return null;
};
