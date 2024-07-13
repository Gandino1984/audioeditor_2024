import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { FileContextProvider } from './contexts/fileContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FileContextProvider>
        <App />
      </FileContextProvider>
  </React.StrictMode>,
)
