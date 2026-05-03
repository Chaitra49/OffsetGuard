import React, { useState, useEffect } from 'react'
import ClaimForm from './pages/ClaimForm.jsx'
import MapPage from './pages/MapPage.jsx'
import VerificationPage from './pages/VerificationPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BlockchainPage from './pages/BlockchainPage.jsx'
import Navbar from './components/Navbar.jsx'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [claimData, setClaimData] = useState(null)
  const [drawnShape, setDrawnShape] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('og-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('og-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const navigate = (p, data = null) => {
    if (data) setClaimData(d => ({ ...d, ...data }))
    setPage(p)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar page={page} setPage={setPage} theme={theme} toggleTheme={toggleTheme} />
      <main style={{ flex: 1, padding: '0' }}>
        {page === 'dashboard' && (
          <Dashboard navigate={navigate} />
        )}
        {page === 'claim' && (
          <ClaimForm
            claimData={claimData}
            setClaimData={setClaimData}
            navigate={navigate}
          />
        )}
        {page === 'map' && (
          <MapPage
            claimData={claimData}
            drawnShape={drawnShape}
            setDrawnShape={setDrawnShape}
            navigate={navigate}
          />
        )}
        {page === 'verify' && (
          <VerificationPage
            claimData={claimData}
            drawnShape={drawnShape}
            verificationResult={verificationResult}
            setVerificationResult={setVerificationResult}
            navigate={navigate}
          />
        )}
        {page === 'blockchain' && (
          <BlockchainPage
            claimData={claimData}
            verificationResult={verificationResult}
            navigate={navigate}
          />
        )}
      </main>
    </div>
  )
}
