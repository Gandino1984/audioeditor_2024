import './App.css'
import AudioWaveform from './components/AudioWaveform.jsx'
import router from './utils/router.jsx'
import { FileContextProvider } from './contexts/fileContext'
import { RouterProvider } from 'react-router-dom';

export function App() {
  
  return (
    <FileContextProvider>
          <RouterProvider router={router} />
    </FileContextProvider>
  )
}

export default App
