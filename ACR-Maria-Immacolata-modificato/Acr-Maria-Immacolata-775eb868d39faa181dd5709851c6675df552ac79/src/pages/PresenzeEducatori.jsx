import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
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
    <div style={{ minHeight: '100vh' }}>
      <SectionHeader classeId={id} titolo="Presenze educatori — oggi" />
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {educatori.length === 0 && (
          <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Nessun educatore assegnato a questa classe.</div>
        )}
        {educatori.map((e) => {
          const presente = presenze[e.id]
          return (
            <div key={e.id} className="acr-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {e.nome}
                {e.ruolo && <span className="acr-mono" style={{ fontSize: 10, color: 'var(--seal-dark)', marginLeft: 8 }}>{e.ruolo.toUpperCase()}</span>}
              </span>
              <span
                className={`acr-mono ${presente ? 'acr-pill-signed' : 'acr-pill-unsigned'}`}
                style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20 }}
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
