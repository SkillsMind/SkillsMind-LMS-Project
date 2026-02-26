import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google' // Google Auth library import ki
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Poori App ko Provider mein wrap kiya taake Google login har jagah chale */}
    <GoogleOAuthProvider clientId="714752160860-tgh3cvchda7nn96hi8v6gaehqsu1dqqt.apps.googleusercontent.com">
  <App />
</GoogleOAuthProvider>
  </StrictMode>,
)