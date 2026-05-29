import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider } from './ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: 'Nunito, sans-serif', fontWeight: 700 },
          duration: 3000,
        }}
      />
    </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
