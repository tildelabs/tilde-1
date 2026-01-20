import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Framework7 from 'framework7/lite'
import Framework7React from 'framework7-react'
import App from './app/App'
import './index.css'

// Initialize Framework7-React Plugin
Framework7.use(Framework7React)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
