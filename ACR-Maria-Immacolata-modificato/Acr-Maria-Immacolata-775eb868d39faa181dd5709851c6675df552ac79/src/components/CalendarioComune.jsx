import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
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
    <div className="cal-card" style={{ padding: '20px' }}>
      
      {/* Header Navigazione Mese */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button
          className="cal-nav-btn"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          style={{ cursor: 'pointer' }}
        >
          <ChevronLeft size={18} />
        </button>

        <span className="acr-display" style={{ fontSize: '16px', fontWeight: '700', textTransform: 'capitalize', color: 'var(--anthracite)' }}>
          {meseLabel}
        </span>

        <button
          className="cal-nav-btn"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          style={{ cursor: 'pointer' }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Griglia Calendario */}
      <div className="cal-grid">
        {GIORNI.map((d) => (
          <div key={d} className="cal-head" style={{ fontWeight: '700', fontSize: '12px', color: 'var(--ink-soft)' }}>
            {d}
          </div>
        ))}

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
              <span>{d}</span>
              {haDati && <span className="cal-dot" style={{ background: 'var(--sage)' }} />}
            </button>
          )
        })}
      </div>

      {/* Box Dettaglio Tematica del Giorno Selezionato */}
      {selected && (
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--rule)', fontSize: '13px', color: 'var(--ink-soft)' }}>
          {tematicaGiorno === null && <span style={{ fontStyle: 'italic' }}>Caricamento tematica…</span>}
          {tematicaGiorno === false && <span>Nessuna tematica registrata per questo giorno.</span>}
          {tematicaGiorno && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => setMostraDescrizione((v) => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--purple-dark)',
                  fontWeight: '600',
                  fontSize: '14px',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <BookOpen size={15} color="var(--purple)" />
                <span>Tematica: "{tematicaGiorno.titolo}"</span>
                <span style={{ fontSize: '10px', marginLeft: 'auto' }}>{mostraDescrizione ? '▲ Riduci' : '▼ Dettagli'}</span>
              </button>

              {mostraDescrizione && (
                <div style={{ marginTop: '4px', padding: '10px 12px', background: 'var(--surface-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--anthracite)', fontSize: '13px', lineHeight: '1.4' }}>
                  {tematicaGiorno.descrizione || 'Nessuna descrizione testuale aggiunta per questo incontro.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
