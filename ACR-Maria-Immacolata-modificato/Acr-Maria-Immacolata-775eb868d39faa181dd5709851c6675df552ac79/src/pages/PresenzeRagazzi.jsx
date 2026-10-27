import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ordinaRagazzi } from '../lib/ordinaNomi'
import { useAuth } from '../context/AuthContext'
import SectionHeader from '../components/SectionHeader'

function oggiISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function PresenzeRagazzi() {
  const { id } = useParams()
  const { educatore } = useAuth()
  const [giorno, setGiorno] = useState(oggiISO())
  const [ragazzi, setRagazzi] = useState([])
  const [presenze, setPresenze] = useState({})
  const [avvisi, setAvvisi] = useState([])
  const [visti, setVisti] = useState(() => { try { return JSON.parse(localStorage.getItem('acr-avvisi-visti') || '[]') } catch { return [] } })

  useEffect(() => {
    carica(giorno)
  }, [id, giorno])

  async function carica(dataISO) {
    const { data: elenco } = await supabase.from('ragazzi').select('*').eq('classe_id', id)
    const { data: pres } = await supabase
      .from('presenze_ragazzi')
      .select('ragazzo_id, presente, segnata_da:educatori(nome)')
      .eq('classe_id', id)
      .eq('data', dataISO)

    const mappa = {}
    ;(pres || []).forEach((p) => { mappa[p.ragazzo_id] = p })
    setRagazzi(ordinaRagazzi(elenco || []))
    setPresenze(mappa)
    const { data: storico } = await supabase.from('presenze_ragazzi').select('ragazzo_id,data,presente').eq('classe_id', id).order('data', { ascending: false })
    const avvisiCalcolati = (elenco || []).filter(r => {
      const registrate = (storico || []).filter(p => p.ragazzo_id === r.id)
      return registrate.length >= 3 && registrate.slice(0, 3).every(p => p.presente === false)
    }).map(r => ({ id: r.id, nome: `${r.nome} ${r.cognome}` }))
    setAvvisi(avvisiCalcolati)
  }

  function prendiVisione(ragazzoId) {
    const nuovi = [...new Set([...visti, ragazzoId])]
    setVisti(nuovi)
    localStorage.setItem('acr-avvisi-visti', JSON.stringify(nuovi))
  }

  async function segnaPresenza(ragazzoId, presente) {
    await supabase.from('presenze_ragazzi').upsert({
      ragazzo_id: ragazzoId,
      classe_id: id,
      data: giorno,
      presente,
      segnata_da: educatore.id,
    }, { onConflict: 'ragazzo_id,data' })
    carica(giorno)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <SectionHeader classeId={id} titolo="Presenze" />
      {avvisi.filter(a => !visti.includes(a.id)).length > 0 && <div style={{margin:'16px 18px 0',padding:14,borderRadius:12,background:'var(--alert-soft)',border:'1px solid var(--alert)'}}>
        <strong style={{color:'var(--alert)'}}>Attenzione: 3 assenze consecutive</strong>
        {avvisi.filter(a => !visti.includes(a.id)).map(a => <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginTop:10}}>
          <span>{a.nome}</span><button className="toggle-btn toggle-presente" onClick={() => prendiVisione(a.id)}>Presa visione</button>
        </div>)}
      </div>}
      <div style={{ padding: '18px 18px 0' }}>
        <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Giorno</label>
        <input
          className="acr-input"
          type="date"
          value={giorno}
          onChange={(e) => setGiorno(e.target.value)}
          style={{ marginBottom: 8 }}
        />
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ragazzi.length === 0 && (
          <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Nessun ragazzo in questa classe. Aggiungilo da "Elenco ragazzi".</div>
        )}
        {ragazzi.map((r) => {
          const p = presenze[r.id]
          return (
            <div key={r.id} className="acr-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div>{r.nome} {r.cognome}</div>
                {p?.segnata_da && (
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>
                    segnata da {p.segnata_da.nome}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => segnaPresenza(r.id, true)}
                  className="toggle-btn toggle-presente"
                  style={p?.presente === true ? { background: 'var(--sage-soft)', color: 'var(--sage)' } : undefined}
                >
                  PRESENTE
                </button>
                <button
                  onClick={() => segnaPresenza(r.id, false)}
                  className="toggle-btn toggle-assente"
                  style={p && p.presente === false ? { background: 'var(--alert-soft)', color: 'var(--alert)' } : undefined}
                >
                  ASSENTE
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
