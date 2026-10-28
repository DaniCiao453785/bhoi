import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, UserCheck, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ordinaEducatori } from '../lib/ordinaNomi'
import SectionHeader from '../components/SectionHeader'

function oggiISO() {
  return new Date().toISOString().slice(0, 10)
}

// Solo visualizzazione: la presenza qui riflette semplicemente chi ha
// firmato oggi (firmare implica essere presenti). Non si può modificare
// a mano — non ha un pulsante per cambiarla.
export default function PresenzeEducatori() {
  const { id } = useParams()
  const [educatori, setEducatori] = useState([])
  const [presenze, setPresenze] = useState({})

  useEffect(() => {
    carica()
  }, [id])

  async function carica() {
    const { data: assegnati } = await supabase
      .from('classe_educatori')
      .select('ruolo, educatore:educatori(id, nome)')
      .eq('classe_id', id)

    const { data: pres } = await supabase
      .from('presenze_educatori')
      .select('educatore_id, presente')
      .eq('classe_id', id)
      .eq('data', oggiISO())

    const mappa = {}
    ;(pres || []).forEach((p) => { mappa[p.educatore_id] = p.presente })

    setEducatori(ordinaEducatori((assegnati || []).filter((a) => a.educatore).map((a) => ({ ...a.educatore, ruolo: a.ruolo }))))
    setPresenze(mappa)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <SectionHeader classeId={id} titolo="Presenze educatori — oggi" />

      <div style={{ maxWidth: '640px', margin: '24px auto 0', padding: '0 var(--page-padding)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Info Box di sola lettura */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-soft)', marginBottom: '4px' }}>
          <ShieldCheck size={18} color="var(--purple)" />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Aggiornato in tempo reale tramite la firma giornaliera.</span>
        </div>

        {/* Stato Vuoto */}
        {educatori.length === 0 && (
          <div className="acr-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Users size={32} color="var(--ink-soft)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', color: 'var(--anthracite)' }}>Nessun educatore assegnato</span>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-soft)' }}>Non ci sono educatori collegati a questa classe.</p>
          </div>
        )}

        {/* Lista Educatori */}
        {educatori.map((e) => {
          const presente = presenze[e.id]
          return (
            <div
              key={e.id}
              className="acr-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', fontSize: '15px', color: 'var(--anthracite)' }}>
                  {e.nome}
                </span>
                {e.ruolo && (
                  <span
                    className="acr-mono"
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      background: 'var(--brand-soft)',
                      color: 'var(--purple-dark)',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid rgba(101, 84, 240, 0.15)'
                    }}
                  >
                    {e.ruolo.toUpperCase()}
                  </span>
                )}
              </div>

              <span
                className={`acr-mono ${presente ? 'acr-pill-signed' : 'acr-pill-unsigned'}`}
              >
                {presente ? 'PRESENTE' : 'ASSENTE'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
