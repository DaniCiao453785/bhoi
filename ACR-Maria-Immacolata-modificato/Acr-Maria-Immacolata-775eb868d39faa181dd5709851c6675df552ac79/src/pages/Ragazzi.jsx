import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, X, Trash2, UserPlus, Users, AlertCircle } from 'lucide-react'
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
    if (!window.confirm("Sei sicuro di voler eliminare questo ragazzo dalla classe?")) return
    await supabase.from('ragazzi').delete().eq('id', ragazzoId)
    setAperto(null)
    carica()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <SectionHeader classeId={id} titolo="Elenco ragazzi" />
      
      <div style={{ maxWidth: '640px', margin: '24px auto 0', padding: '0 var(--page-padding)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Pulsante Azione Moderatore */}
        {isModerator && (
          <button
            onClick={() => setMostraForm((v) => !v)}
            className="acr-btn-primary"
            style={{ width: '100%', gap: '8px', background: mostraForm ? 'var(--anthracite)' : 'var(--purple)' }}
          >
            {mostraForm ? <X size={18} /> : <UserPlus size={18} />}
            {mostraForm ? 'Chiudi modulo' : 'Aggiungi nuovo ragazzo'}
          </button>
        )}

        {/* Form di inserimento */}
        {isModerator && mostraForm && (
          <form onSubmit={aggiungiRagazzo} className="acr-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', animation: 'cardEntrance 300ms cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <h3 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--anthracite)' }}>
              Scheda Partecipante
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nome *</label>
                <input className="acr-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Marco" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Cognome *</label>
                <input className="acr-input" value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Es. Rossi" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Età</label>
                <input className="acr-input" type="number" min="0" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="Es. 10" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Intolleranze / Note</label>
                <input className="acr-input" value={intolleranze} onChange={(e) => setIntolleranze(e.target.value)} placeholder="Es. Glutine, Lattosio..." />
              </div>
            </div>

            <button type="submit" className="acr-btn-primary" disabled={salvando} style={{ marginTop: '4px' }}>
              {salvando ? 'Salvataggio in corso…' : 'Salva nel registro'}
            </button>
          </form>
        )}

        {/* Stato vuoto */}
        {ragazzi.length === 0 && !mostraForm && (
          <div className="acr-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Users size={32} color="var(--ink-soft)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', color: 'var(--anthracite)' }}>Ancora nessun ragazzo</span>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-soft)' }}>
              Non ci sono partecipanti in questa classe.{!isModerator && ' Solo un moderatore può aggiungerne.'}
            </p>
          </div>
        )}

        {/* Lista dei ragazzi */}
        {ragazzi.map((r) => {
          const isAperto = aperto === r.id
          return (
            <div
              key={r.id}
              onClick={() => setAperto(isAperto ? null : r.id)}
              className="acr-card"
              style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 200ms ease' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', fontSize: '15px', color: 'var(--anthracite)' }}>
                  {r.nome} {r.cognome}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--purple)', background: 'var(--brand-soft)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }}>
                  {r.eta ? `${r.eta} anni` : 'Età n.d.'}
                </span>
              </div>

              {isAperto && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--rule)', fontSize: '14px', color: 'var(--ink-soft)', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'cardEntrance 200ms ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={15} color={r.intolleranze ? 'var(--coral)' : 'var(--ink-soft)'} />
                    <span><strong>Intolleranze:</strong> {r.intolleranze || 'Nessuna segnalata'}</span>
                  </div>

                  {isModerator && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); eliminaRagazzo(r.id) }}
                      style={{
                        marginTop: '8px',
                        background: 'var(--alert-soft)',
                        border: '1px solid #FEE2E2',
                        color: 'var(--alert)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        width: '100%'
                      }}
                    >
                      <Trash2 size={15} /> Elimina ragazzo
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
