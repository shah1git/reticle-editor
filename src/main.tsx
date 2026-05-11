import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './shared/i18n'
import './global.css'
import Landing from './Landing'
import ThermalApp from './thermal/ThermalApp'
import OpticalApp from './optical/OpticalApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/thermal/*" element={<ThermalApp />} />
        <Route path="/optical/*" element={<OpticalApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
