import './App.css'
import AudioWaveform from './components/AudioWaveform.jsx'

export function App() {
  

  return (
    <FileContextProvider>
        <div>
          <RouterProvider router={router} />
        </div>   
    </FileContextProvider>
  )
}

export default App
