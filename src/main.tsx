import React from 'react'
import ReactDOM from 'react-dom/client'
import 'mathlive'
import App from './App'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import './styles.css'
import './practiceModes.css'
import './metadataFlow.css'
import './backupControls.css'
import './pwaUpdatePrompt.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <PwaUpdatePrompt />
  </React.StrictMode>,
)
