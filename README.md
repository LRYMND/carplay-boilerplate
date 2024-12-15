# Vite + Flask + SocketIO + Carplay Boilerplate

This repository provides a boilerplate for creating a web application that combine a **Vite-powered frontend** with a **Flask backend** and **Apple Carplay/Android Auto** integration. The backend serves the web application and facilitates real-time communication between the frontend and backend via **Socket.IO**. Application settings are managed using a **Zustand Store** and are stored in a `.config` JSON file for persistence.  

## Key Features  

- **Carplay / AndroidAuto**: Integration of the node-carplay package
- **Modern Frontend**: Developed with Vite for fast builds, hot module replacement (HMR)
- **Flask Backend**: Python-based backend to handle HTTP requests, serve static files, and manage backend logic.  
- **Socket.IO Integration**: Real-time, bi-directional communication between the frontend and backend.  
- **Persistent App Settings**: Frontend settings managed with Zustand and stored in a `.config` JSON file on the user's machine.  
- **Easy Setup**: Simplified process for running the development environment and packaging the app for production.  
- **Built-in Hosting**: Once packaged, the app can be launched with the Python backend automatically opening the frontend in the browser.  

---

## Getting Started  

### Prerequisites  

Make sure you have the following installed on your system:  
- Python 3.9+  
- Node.js (LTS version recommended)  
- npm  

---

### Installation  

1. **Clone the Repository**:  
   ```bash  
   git clone carplay-boilerplate  
   cd carplay-boilerplate 
   ```  

2. **Install Backend Dependencies**:  
   Navigate to the backend directory and install the required Python packages:  
   ```bash  
   pip install -r requirements.txt  
   ```  

3. **Install Frontend Dependencies**:  
   Navigate to the `frontend` directory and install the necessary npm packages:  
   ```bash  
   cd frontend  
   npm i
   ```  

---

### Running the Development Environment  

1. **Start the Frontend**:  
   Inside the `frontend` directory, run the following command to start the Vite development server:  
   ```bash  
   npm run dev  
   ```  
   The frontend will be available at `http://localhost:5137`. 

2. **Start the Backend**:  
   In the root directory of the project, start the Flask backend:  
   ```bash  
   python app.py --vite --nokiosk
   ```  
   Using the --vite flag, the backend automatically loads the resources from the development environment.
---

### Application Settings  

- The frontend uses Zustand to manage application state.  
- State changes can be sent to the backend via Socket.IO events.  
- The backend saves these settings to a JSON file located in the `.config` directory of the user's system.  

---

### Packaging the App  

Once your app is ready for deployment, it can be packaged as follows:  

1. Build the frontend:  
   Inside the `frontend` directory, run:  
   ```bash  
   npm run build  
   ```  
   This will create a production-ready build in the `dist` folder.  

2. Update the Flask backend to serve the static files from the frontend's `dist` folder.  

3. Run the packaged app:  
   Simply execute the Python backend (`app.py`), which will automatically launch the app in the default web browser.  

---

### File Structure  

```
project-root/  
├── app.py                   # Application entry point  
├── requirements.txt         # Python dependencies
├── backend/                 # Backend directory 
│   └──  config/             # Default configuration files  
└── frontend/                # Frontend directory  
    ├── src/                 # Source code for the frontend  
    ├── public/              # Public assets  
    ├── vite.config.js       # Vite configuration  
    ├── package.json         # Frontend dependencies  
    └── ...  
```

---

### Technologies Used  

#### Frontend  
- **Vite**: A modern build tool for faster development.  
- **React (Optional)**: If your frontend uses React.  
- **Zustand**: Lightweight state management library. 
- **node-carplay**: Opensource carplay package.   

#### Backend  
- **Flask**: Python web framework.  
- **Socket.IO**: For real-time communication between the frontend and backend.  

---

### Contributing  

1. Fork the repository.  
2. Create a feature branch:  
   ```bash  
   git checkout -b feature-name  
   ```  
3. Commit your changes:  
   ```bash  
   git commit -m "Add feature-name"  
   ```  
4. Push to the branch:  
   ```bash  
   git push origin feature-name  
   ```  
5. Open a Pull Request.  

---
