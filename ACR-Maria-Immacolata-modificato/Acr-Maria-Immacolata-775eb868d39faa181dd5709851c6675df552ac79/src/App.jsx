import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function RottaProtetta({ children }) {
  const { educatore, loading } = useAuth()
  if (loading) return null
  if (!educatore) return <Navigate to="/login" replace />
  return children
}

function RottaModeratore({ children }) {
  const { educatore, loading } = useAuth()
  if (loading) return null
  if (!educatore) return <Navigate to="/login" replace />
  if (!educatore.moderatore) return <Navigate to="/" replace />
  return children
}

function Rotte() {
  const { loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RottaProtetta><Home /></RottaProtetta>} />
      <Route path="/classe/:id" element={<RottaProtetta><Classe /></RottaProtetta>} />
      <Route path="/classe/:id/presenze-educatori" element={<RottaProtetta><PresenzeEducatori /></RottaProtetta>} />
      <Route path="/classe/:id/presenze-ragazzi" element={<RottaProtetta><PresenzeRagazzi /></RottaProtetta>} />
      <Route path="/classe/:id/statistiche" element={<RottaProtetta><Statistiche /></RottaProtetta>} />
      <Route path="/classe/:id/tematiche" element={<RottaProtetta><Tematiche /></RottaProtetta>} />
      <Route path="/classe/:id/ragazzi" element={<RottaProtetta><Ragazzi /></RottaProtetta>} />
      <Route path="/aggiunta" element={<RottaModeratore><Aggiunta /></RottaModeratore>} />
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
