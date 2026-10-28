import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const useNavigateInstance = useNavigate()
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
      useNavigateInstance('/')
    } catch (err) {
      setErrore(err.message)
    } finally {
      setCaricando(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      
      {/* Header Band in stile Mediterranean Pop */}
      <div className="acr-band" style={{ padding: '52px 24px 60px' }}>
        <div className="acr-display" style={{ fontSize: '28px', fontWeight: '700', color: '#FFFFFF' }}>
          Maria Immacolata
        </div>
        <div style={{ opacity: 0.85, fontSize: '13px', marginTop: '4px', fontFamily: 'Inter, sans-serif', fontWeight: '500' }}>
          ACR · Portale Educatori · Registro Firme
        </div>
      </div>

      {/* Contenuto Form di Accesso */}
      <div style={{ flex: 1, padding: '0 20px 40px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <form
          onSubmit={handleSubmit}
          className="acr-card"
          style={{ width: '100%', maxWidth: '380px', padding: '32px 24px', marginTop: '-42px', background: '#FFFFFF', boxShadow: 'var(--shadow-hover)' }}
        >
          {/* Titolo Sezione */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: 'var(--purple-dark)' }}>
            <Lock size={18} />
            <span className="acr-mono" style={{ fontSize: '11px', letterSpacing: '0.05em', fontWeight: '700', textTransform: 'uppercase' }}>
              Accesso Educatori
            </span>
          </div>

          {/* Campo Nome */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Nome e cognome
            </label>
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

          {/* Campo Password */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Password
            </label>
            <input
              className="acr-input"
              type="password"
              name="password_educatore"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Box Errore */}
          {errore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--alert)', background: 'var(--alert-soft)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', marginBottom: '16px', border: '1px solid #FEE2E2' }}>
              <AlertCircle size={16} flexShrink={0} />
              <span>{errore}</span>
            </div>
          )}

          {/* Checkbox Ricordami */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: '500', color: 'var(--anthracite)', margin: '16px 0 24px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={ricordami}
              onChange={(e) => setRicordami(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--purple)', cursor: 'pointer' }}
            />
            Ricordami su questo dispositivo
          </label>

          {/* Pulsante Invio */}
          <button
            type="submit"
            className="acr-btn-primary"
            style={{ width: '100%' }}
            disabled={caricando}
          >
            {caricando ? 'Accesso in corso…' : 'Accedi al portale'}
          </button>
        </form>
      </div>
    </div>
  )
}
