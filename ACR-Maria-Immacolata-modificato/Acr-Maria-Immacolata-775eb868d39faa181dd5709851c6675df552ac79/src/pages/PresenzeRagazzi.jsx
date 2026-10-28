import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Check, Users, Calendar } from 'lucide-react'
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
  const [visti, setVisti] = useState(() => { 
    try { return JSON.parse(localStorage.getItem('acr-avvisi-visti') || '[]') } catch { return [] } 
  })

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

    const { data: storico } = await supabase
      .from('presenze_ragazzi')
      .select('ragazzo_id,data,presente')
      .eq('classe_id', id)
      .order('data', { ascending: false })

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

  const avvisiAttivi = avvisi.filter(a => !visti.includes(a.id))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <SectionHeader classeId={id} titolo="Presenze" />

      <div style={{ maxWidth: '680px', margin: '20px auto 0', padding: '0 var(--page-padding)', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Box Avviso 3 Assenze Consecutive */}
        {avvisiAttivi.length > 0 && (
          <div
            className="acr-card"
            style={{
              padding: '18px 20px',
              background: 'var(--alert-soft)',
              borderColor: '#FECACA',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--alert)' }}>
              <AlertTriangle size={20} />
              <strong style={{ fontFamily: 'Poppins, sans-serif', fontSize: '14px', fontWeight: '700' }}>
                Attenzione: 3 assenze consecutive
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {avvisiAttivi.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #FCA5A5' }}>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', fontSize: '14px', color: 'var(--anthracite)' }}>
                    {a.nome}
                  </span>
                  <button
                    className="toggle-btn"
                    onClick={() => prendiVisione(a.id)}
                    style={{ background: 'var(--brand-soft)', color: 'var(--purple)', border: '1px solid #DED8FF' }}
                  >
                    <Check size={14} style={{ marginRight: '4px' }} /> Presa visione
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selettore Giorno */}
        <div className="acr-card" style={{ padding: '16px 20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>
            <Calendar size={14} color="var(--purple)" /> Seleziona Data
          </label>
          <input
            className="acr-input"
            type="date"
            value={giorno}
            onChange={(e) => setGiorno(e.target.value)}
          />
        </div>

        {/* Stato Vuoto */}
        {ragazzi.length === 0 && (
          <div className="acr-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Users size={32} color="var(--ink-soft)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', color: 'var(--anthracite)' }}>
              Nessun ragazzo in questa classe
            </span>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-soft)' }}>
              Aggiungili dalla sezione "Elenco ragazzi" per poter registrare le presenze.
            </p>
          </div>
        )}

        {/* Lista Ragazzi per Appello */}
        {ragazzi.map((r) => {
          const p = presenze[r.id]
          const isPresente = p?.presente === true
          const isAssente = p?.presente === false

          return (
            <div
              key={r.id}
              className="acr-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', fontSize: '15px', color: 'var(--anthracite)' }}>
                  {r.nome} {r.cognome}
                </div>
                {p?.segnata_da && (
                  <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--ink-soft)', marginTop: '2px' }}>
                    segnata da <strong>{p.segnata_da.nome}</strong>
                  </div>
                )}
              </div>

              {/* Toggles Presente / Assente */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => segnaPresenza(r.id, true)}
                  className={`toggle-btn toggle-presente ${isPresente ? 'active' : ''}`}
                >
                  PRESENTE
                </button>
                <button
                  type="button"
                  onClick={() => segnaPresenza(r.id, false)}
                  className={`toggle-btn toggle-assente ${isAssente ? 'active' : ''}`}
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
