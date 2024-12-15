# shared_state.py

import threading

class SharedState:
    def __init__(self):
        #Global Variables
        self.verbose = False

        self.rpiModel = 5
        self.sessionType = "wayland"

        self.vite = True
        self.isKiosk = True

        #Thread States:
        self.toggle_app = threading.Event()

        self.exit_event = threading.Event()
        self.restart_event = threading.Event()
        self.hdmi_event = threading.Event()

        self.THREAD_STATES = {
            "server":   False,
            "app":      False,
        }

shared_state = SharedState()