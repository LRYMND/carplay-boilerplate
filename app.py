"""
    carplay-boilerplate.
    Copyright (C) 2024
    Author:     Louis Raymond - github.com/lrymnd

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
"""

import sys
import os

import time
import argparse


from tabulate import tabulate

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.server              import ServerThread
from backend.app                 import APPThread

from backend.shared.shared_state import shared_state

rpiModel = ""
rpiProtocol = ""

class Main:
    def __init__(self):
        self.exit_event = shared_state.exit_event
        self.rpiModel = ""
        self.rpiProtocol =""
        self.threads = {
            'server':   ServerThread(),
            'app':      APPThread(),
        }

    def detect_rpi(self):

        try:
            # Get Raspberry Model
            with open('/proc/device-tree/model', 'r') as f:
                model = f.read().strip()
                for i in range(3, 6):
                    if 'Raspberry Pi ' + str(i) in model:
                        shared_state.rpiModel = i
                        self.rpiModel = 'Raspberry Pi ' + str(i)
                        break

                    elif i == 5:
                        'Device not Recognized, using config for Raspberry Pi 4.'
                        self.rpiModel = "Unknown"
                        shared_state.rpiModel = 4
            
            # Get Session Type
            session_type = os.getenv('XDG_SESSION_TYPE')
            if session_type == 'wayland':
                shared_state.sessionType = 'wayland'
                self.rpiProtocol = 'Wayland'
            elif session_type == 'x11':
                shared_state.sessionType = 'x11'
                self.rpiProtocol = 'X11'
            else:
                self.rpiProtocol = 'Unknown'

        except FileNotFoundError:
            return 'Not running on a Raspberry Pi or file at /proc/device-tree/model not found.'
    
    def start_modules(self):
        self.start_thread('app')

    def start_thread(self, thread_name):
        thread_class = self.threads[thread_name].__class__

        if not self.threads[thread_name].is_alive():
            self.threads[thread_name] = thread_class()
            thread = self.threads[thread_name]
            thread.daemon = True
            thread.start()
            shared_state.THREAD_STATES[thread_name] = True
            if(shared_state.verbose): print(f'{thread_name} thread started.')
        else:
            if(shared_state.verbose): print(f'{thread_name} thread is already running.')


    def stop_thread(self, thread_name):
        thread = self.threads[thread_name]
        if thread.is_alive():
            if(shared_state.verbose): print(f'Stopping {thread_name} thread.')
            thread.stop_thread()
            try:
                thread.join()
            except Exception as e:
                print(e)
            shared_state.THREAD_STATES[thread_name] = False
            if(shared_state.verbose): print(f'{thread_name} thread stopped.')


    def toggle_thread(self, thread_name):
        if shared_state.THREAD_STATES[thread_name]:
            self.stop_thread(thread_name)
            if(shared_state.verbose): print('stop thread')
        else:
            self.start_thread(thread_name)
            if(shared_state.verbose): print('start thread')


    def join_threads(self):
        for thread_name, thread in self.threads.items():
            self.stop_thread(thread_name)
            if thread.is_alive():
                shared_state.THREAD_STATES[thread_name] = False


    def process_toggle_event(self):
        if shared_state.toggle_app.is_set():
            self.toggle_thread('app')
            shared_state.toggle_app.clear()


    def process_exit_event(self):
        if self.exit_event.is_set():
            self.exit_event.clear()
            time.sleep(5)
            shared_state.toggle_app.set()


    def process_restart_event(self):
        if shared_state.restart_event.is_set():
            shared_state.restart_event.clear()
            for thread_name in self.threads:
                if(thread_name != 'server'):
                    self.stop_thread(thread_name)
                       
            time.sleep(.5)
            print('Restarting...')
            time.sleep(1)
            
            self.start_modules()


    def print_thread_states(self):
        if(shared_state.verbose):
            for thread_name, thread in self.threads.items():
                state = 'Alive' if thread.is_alive() else 'Not Alive'
                print(f'{thread_name} Thread: {state}')
                


def clear_screen():
    if os.name == 'nt':
        os.system('cls')
    else:
        os.system('clear')


def non_blocking_input(prompt):
    try:
        return input(prompt)
    except EOFError:
        return None
    

def setup_arguments():
    parser = argparse.ArgumentParser(
        description="Application Manual:\n\n"
                "This application can be run in various modes for development, testing, and production. "
                "Use the flags below to customize behavior.\n",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    parser.add_argument("--vite", action="store_false", help="Start on Vite-Port 5173")
    parser.add_argument("--nokiosk", action="store_false", help="Start in windowed mode")

    return parser.parse_args()


def display_thread_states():
    clear_screen()
    # Display the app name and version
    print("Vite / Flask Boilerplate")
    print('Device: ', main.rpiModel, ' | ', main.rpiProtocol)
    print("")
    print("=" * 52)  # Decorative line
    print("")
    print("Thread states:")
    table_data = [
        ["Server", "App"],
        [
            shared_state.THREAD_STATES['server'],
            shared_state.THREAD_STATES['app'],
        ]
    ]

    table = tabulate(table_data, tablefmt="fancy_grid")
    print("\n" + table)


if __name__ == '__main__':
    shared_state.hdmi_event.set()
    clear_screen()

    main = Main()

    main.start_thread('server')
    main.detect_rpi()

    args = setup_arguments()
    
    # Update shared_state based on arguments
    shared_state.verbose = args.verbose
    shared_state.vite = args.vite
    shared_state.isKiosk = args.nokiosk

    # Start main threads:
    main.start_modules()
    main.print_thread_states()

    try:
        while not main.exit_event.is_set():
            main.process_toggle_event()
            main.process_exit_event()
            main.process_restart_event()

            if not shared_state.verbose:
                display_thread_states()

            time.sleep(.1)
    except KeyboardInterrupt:
            print('\nCleaning up threads, please wait...')
    finally:
            main.join_threads()
            print('Done.')
            sys.exit(0)