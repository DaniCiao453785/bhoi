import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import Classe from './pages/Classe'
import PresenzeEducatori from './pages/PresenzeEducatori'
import PresenzeRagazzi from './pages/PresenzeRagazzi'
import Statistiche from './pages/Statistiche'
import Tematiche from './pages/Tematiche'
import Ragazzi from './pages/Ragazzi'
import Aggiunta from './pages/Aggiunta'

// Schermata di caricamento elegante con effetto Skeleton / Pulse
function LoadingScreen() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: 'var(--bg)',
      }}
    >
      <div
        className="acr-card"
        style={{
          padding: '36px 32px',
          textAlign: 'center',
          maxWidth: '360px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--brand-soft)',
            borderTopColor: 'var(--purple)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <span
          className="acr-display"
          style={{ fontSize: '18px', color: 'var(--anthracite)' }}
        >
          Caricamento Portale...
        </span>
        <div className="acr-skeleton acr-skeleton-text" style={{ width: '70%', margin: 0 }} />
      </div>
    </div>
  )
}

function Guard({ children, soloModeratore = false }) {
  const { educatore, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }
  if (!educatore) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (soloModeratore && !educatore.moderatore) {
    return <Navigate to="/" replace />
  }
  return children
}

function NotFound() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        padding: 'var(--page-padding)',
        background: 'var(--bg)',
      }}
    >
      <div
        className="acr-card"
        style={{
          maxWidth: '420px',
          width: '100%',
          padding: '40px 28px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <span
          className="acr-pill-unsigned"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          Errore 404
        </span>
        <h1
          className="acr-display"
          style={{ fontSize: '56px', margin: 0, color: 'var(--purple)' }}
        >
          404
        </h1>
        <p
          style={{
            margin: 0,
            color: 'var(--ink-soft)',
            fontSize: '15px',
            lineHeight: 1.5,
          }}
        >
          Ops! La pagina che stavi cercando non esiste o è stata spostata.
        </p>
        <a href="/" className="acr-btn-primary" style={{ marginTop: '8px', width: '100%' }}>
          Torna alla Home
        </a>
      </div>
    </div>
  )
}

function Rotte() {
  const { educatore, loading } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={loading ? <LoadingScreen /> : educatore ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/" element={<Guard><Home /></Guard>} />
      <Route path="/classe/:id" element={<Guard><Classe /></Guard>} />
      <Route path="/classe/:id/presenze-educatori" element={<Guard><PresenzeEducatori /></Guard>} />
      <Route path="/classe/:id/presenze-ragazzi" element={<Guard><PresenzeRagazzi /></Guard>} />
      <Route path="/classe/:id/statistiche" element={<Guard><Statistiche /></Guard>} />
      <Route path="/classe/:id/tematiche" element={<Guard><Tematiche /></Guard>} />
      <Route path="/classe/:id/ragazzi" element={<Guard><Ragazzi /></Guard>} />
      <Route path="/aggiunta" element={<Guard soloModeratore><Aggiunta /></Guard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Rotte />
      </AuthProvider>
    </BrowserRouter>
  )
}
