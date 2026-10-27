import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

function toISO(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarioComune({ classeId, onSelectDay }) {
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [tematicaGiorno, setTematicaGiorno] = useState(null)
  const [mostraDescrizione, setMostraDescrizione] = useState(false)
  const [giorniConDati, setGiorniConDati] = useState(new Set())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  useEffect(() => {
    if (!classeId) return
    const inizio = toISO(year, month, 1)
    const fine = toISO(year, month, daysInMonth)
    supabase
      .from('tematiche')
      .select('data')
      .eq('classe_id', classeId)
      .gte('data', inizio)
      .lte('data', fine)
      .then(({ data }) => {
        setGiorniConDati(new Set((data || []).map((t) => t.data)))
      })
  }, [classeId, year, month])

  async function selezionaGiorno(d) {
    setSelected(d)
    setMostraDescrizione(false)
    setTematicaGiorno(null)
    const dataISO = toISO(year, month, d)
    onSelectDay?.(dataISO)
    const { data } = await supabase
      .from('tematiche')
      .select('titolo, descrizione')
      .eq('classe_id', classeId)
      .eq('data', dataISO)
      .maybeSingle()
    setTematicaGiorno(data || false) // false = caricata ma assente
  }

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const today = new Date()
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  const meseLabel = cursor.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  return (
    <div className="cal-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="cal-nav-btn" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
        <span className="acr-display" style={{ fontSize: 15, textTransform: 'capitalize' }}>{meseLabel}</span>
        <button className="cal-nav-btn" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
      </div>
      <div className="cal-grid">
        {GIORNI.map((d) => <div key={d} className="cal-head">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-day empty" />
          const haDati = giorniConDati.has(toISO(year, month, d))
          const sel = selected === d
          return (
            <button
              key={i}
              className={`cal-day ${isToday(d) ? 'today' : ''} ${sel ? 'selected' : ''}`}
              onClick={() => selezionaGiorno(d)}
            >
              {d}
              {haDati && <span className="cal-dot" style={{ background: 'var(--sage)' }} />}
            </button>
          )
        })}
      </div>
      {selected && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--rule)', fontSize: 13, color: 'var(--ink-soft)' }}>
          {tematicaGiorno === null && 'Caricamento…'}
          {tematicaGiorno === false && 'Nessuna tematica per questo giorno'}
          {tematicaGiorno && (
            <>
              <button
                onClick={() => setMostraDescrizione((v) => !v)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--ink)', fontSize: 13, textAlign: 'left' }}
              >
                Tematica: "{tematicaGiorno.titolo}" {mostraDescrizione ? '▲' : '▼'}
              </button>
              {mostraDescrizione && (
                <div style={{ marginTop: 8, color: 'var(--ink-soft)' }}>
                  {tematicaGiorno.descrizione || 'Nessuna descrizione aggiunta'}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
