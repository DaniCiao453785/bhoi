import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [password, setPassword] = useState('')
  const [ricordami, setRicordami] = useState(true)
  const [errore, setErrore] = useState('')
  const [caricando, setCaricando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrore('')
    setCaricando(true)
    try {
      await login({ nome, password, ricordami })
      navigate('/')
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div className="acr-band" style={{ padding: '48px 24px 40px' }}>
        <div className="acr-display" style={{ fontSize: 26, fontWeight: 700 }}>Maria Immacolata</div>
        <div style={{ opacity: 0.9, fontSize: 13, marginTop: 2 }}>ACR · Portale Educatori · Registro Firme</div>
      </div>
      <div style={{ flex: 1, padding: '28px 20px', display: 'flex', justifyContent: 'center' }}>
        <form
          onSubmit={handleSubmit}
          className="acr-card"
          style={{ width: '100%', maxWidth: 360, padding: 28, marginTop: -32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, color: 'var(--seal-dark)' }}>
            <Lock size={16} />
            <span className="acr-mono" style={{ fontSize: 12, letterSpacing: 1 }}>ACCESSO EDUCATORI</span>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Nome e cognome</label>
            <input
              className="acr-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="es. Rosanna Pica"
              type="text"
              name="nome_educatore"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Password</label>
            <input
              className="acr-input"
              type="password"
              name="password_educatore"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {errore && (
            <div style={{ color: 'var(--alert)', fontSize: 13, marginBottom: 12 }}>{errore}</div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, margin: '12px 0 24px', cursor: 'pointer' }}>
            <input type="checkbox" checked={ricordami} onChange={(e) => setRicordami(e.target.checked)} />
            Ricordami su questo dispositivo
          </label>
          <button className="acr-btn-primary" style={{ width: '100%' }} disabled={caricando}>
            {caricando ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
