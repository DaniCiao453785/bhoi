import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ordinaRagazzi } from '../lib/ordinaNomi'
import { useAuth } from '../context/AuthContext'
import SectionHeader from '../components/SectionHeader'

export default function Ragazzi() {
  const { id } = useParams()
  const { educatore } = useAuth()
  const isModerator = !!educatore?.moderatore
  const [ragazzi, setRagazzi] = useState([])
  const [aperto, setAperto] = useState(null)
  const [mostraForm, setMostraForm] = useState(false)
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [eta, setEta] = useState('')
  const [intolleranze, setIntolleranze] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carica()
  }, [id])

  async function carica() {
    const { data } = await supabase.from('ragazzi').select('*').eq('classe_id', id)
    setRagazzi(ordinaRagazzi(data || []))
  }

  async function aggiungiRagazzo(e) {
    e.preventDefault()
    setSalvando(true)
    const { error } = await supabase.from('ragazzi').insert({
      classe_id: id,
      nome: nome.trim(),
      cognome: cognome.trim(),
      eta: eta ? Number(eta) : null,
      intolleranze: intolleranze.trim() || null,
    })
    setSalvando(false)
    if (!error) {
      setNome(''); setCognome(''); setEta(''); setIntolleranze('')
      setMostraForm(false)
      carica()
    }
  }

  async function eliminaRagazzo(ragazzoId) {
    await supabase.from('ragazzi').delete().eq('id', ragazzoId)
    setAperto(null)
    carica()
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <SectionHeader classeId={id} titolo="Elenco ragazzi" />
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isModerator && (
          <button
            onClick={() => setMostraForm((v) => !v)}
            className="acr-card"
            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', justifyContent: 'center', color: 'var(--seal-dark)', fontWeight: 500 }}
          >
            {mostraForm ? <X size={16} /> : <Plus size={16} />}
            {mostraForm ? 'Annulla' : 'Aggiungi ragazzo'}
          </button>
        )}

        {isModerator && mostraForm && (
          <form onSubmit={aggiungiRagazzo} className="acr-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Nome</label>
                <input className="acr-input" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Cognome</label>
                <input className="acr-input" value={cognome} onChange={(e) => setCognome(e.target.value)} required />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Età</label>
              <input className="acr-input" type="number" min="0" value={eta} onChange={(e) => setEta(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Intolleranze (opzionale)</label>
              <input className="acr-input" value={intolleranze} onChange={(e) => setIntolleranze(e.target.value)} />
            </div>
            <button className="acr-btn-primary" disabled={salvando}>
              {salvando ? 'Salvataggio…' : 'Salva ragazzo'}
            </button>
          </form>
        )}

        {ragazzi.length === 0 && !mostraForm && (
          <div style={{ color: 'var(--ink-soft)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            Ancora nessun ragazzo in questa classe.
            {!isModerator && ' Solo un moderatore può aggiungerlo.'}
          </div>
        )}

        {ragazzi.map((r) => {
          const isAperto = aperto === r.id
          return (
            <button
              key={r.id}
              onClick={() => setAperto(isAperto ? null : r.id)}
              className="acr-card"
              style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%' }}
            >
              <div>{r.nome} {r.cognome}</div>
              {isAperto && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-soft)' }}>
                  <div>Età: {r.eta ?? '—'}</div>
                  <div style={{ marginTop: 4 }}>
                    Intolleranze: {r.intolleranze || 'nessuna segnalata'}
                  </div>
                  {isModerator && (
                    <div
                      onClick={(e) => { e.stopPropagation(); eliminaRagazzo(r.id) }}
                      style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--alert)', fontWeight: 500, cursor: 'pointer' }}
                    >
                      <Trash2 size={15} /> Elimina ragazzo
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
