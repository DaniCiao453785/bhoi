import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ordinaEducatori } from '../lib/ordinaNomi'
import { useAuth } from '../context/AuthContext'
import { ordinaClassi } from '../lib/ordinaClassi'

function oggiISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Aggiunta() {
  const { educatore } = useAuth()
  const navigate = useNavigate()
  const [sezione, setSezione] = useState('classi')

  const [classi, setClassi] = useState([])
  const [educatori, setEducatori] = useState([])
  const [classeSelId, setClasseSelId] = useState(null)
  const [assegnatiSel, setAssegnatiSel] = useState([]) // id degli educatori assegnati alla classe selezionata
  const [nonFirmate, setNonFirmate] = useState([])

  const [nomeClasse, setNomeClasse] = useState('')

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [eta, setEta] = useState('')
  const [intolleranze, setIntolleranze] = useState('')
  const [ragazzoSalvato, setRagazzoSalvato] = useState(false)

  useEffect(() => {
    caricaClassi()
    // niente password: si scaricano solo i campi che servono
    supabase.from('educatori').select('id, nome').then(({ data }) => setEducatori(ordinaEducatori(data || [])))
  }, [])

  useEffect(() => {
    if (!classeSelId) return
    supabase
      .from('classe_educatori')
      .select('educatore_id')
      .eq('classe_id', classeSelId)
      .then(({ data }) => setAssegnatiSel((data || []).map((a) => a.educatore_id)))
  }, [classeSelId])

  async function caricaClassi() {
    const { data: righe } = await supabase.from('classi').select('*')
    const data = ordinaClassi(righe || [])
    setClassi(data)
    if (data.length && !classeSelId) setClasseSelId(data[0].id)

    // classi non ancora firmate oggi da nessuno
    const { data: firme } = await supabase.from('firme').select('classe_id').eq('data', oggiISO())
    const idsFirmati = new Set((firme || []).map((f) => f.classe_id))
    setNonFirmate((data || []).filter((c) => !idsFirmati.has(c.id)))
  }

  async function creaClasse(e) {
    e.preventDefault()
    if (!nomeClasse.trim()) return
    // la nuova classe va in fondo all'elenco
    const prossimoOrdine = Math.max(0, ...classi.map((c) => c.ordine ?? 0)) + 1
    await supabase.from('classi').insert({ nome: nomeClasse.trim(), ordine: prossimoOrdine })
    setNomeClasse('')
    caricaClassi()
  }

  async function toggleAssegnazione(educatoreId) {
    const assegnato = assegnatiSel.includes(educatoreId)
    if (assegnato) {
      await supabase.from('classe_educatori').delete().eq('classe_id', classeSelId).eq('educatore_id', educatoreId)
      setAssegnatiSel((a) => a.filter((id) => id !== educatoreId))
    } else {
      await supabase.from('classe_educatori').insert({ classe_id: classeSelId, educatore_id: educatoreId })
      setAssegnatiSel((a) => [...a, educatoreId])
    }
  }

  async function aggiungiRagazzo(e) {
    e.preventDefault()
    if (!classeSelId) return
    await supabase.from('ragazzi').insert({
      classe_id: classeSelId,
      nome: nome.trim(),
      cognome: cognome.trim(),
      eta: eta ? Number(eta) : null,
      intolleranze: intolleranze.trim() || null,
    })
    setNome(''); setCognome(''); setEta(''); setIntolleranze('')
    setRagazzoSalvato(true)
    setTimeout(() => setRagazzoSalvato(false), 1800)
  }

  async function firmaPerLoro(classeId) {
    await supabase.from('firme').upsert({
      classe_id: classeId,
      educatore_id: educatore.id,
      data: oggiISO(),
    }, { onConflict: 'classe_id,educatore_id,data' })
    await supabase.from('presenze_educatori').upsert({
      classe_id: classeId,
      educatore_id: educatore.id,
      data: oggiISO(),
      presente: true,
    }, { onConflict: 'classe_id,educatore_id,data' })
    caricaClassi()
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="acr-band" style={{ padding: '20px 20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0, marginBottom: 14 }}
        >
          <ChevronLeft size={18} /> <span style={{ fontSize: 14 }}>Home</span>
        </button>
        <div className="acr-display" style={{ fontSize: 20, fontWeight: 600 }}>Aggiunta</div>
        <div style={{ opacity: 0.9, fontSize: 13 }}>Pannello moderatore</div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '16px 18px 0', flexWrap: 'wrap' }}>
        {[
          { key: 'classi', label: 'Nuova classe' },
          { key: 'assegna', label: 'Assegna educatori' },
          { key: 'ragazzi', label: 'Aggiungi ragazzo' },
          { key: 'firma', label: 'Firma per loro' },
        ].map((s) => (
          <button key={s.key} className={`chip ${sezione === s.key ? 'active' : ''}`} onClick={() => setSezione(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      {sezione === 'classi' && (
        <form onSubmit={creaClasse} className="acr-card" style={{ margin: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Nome classe</label>
            <input className="acr-input" value={nomeClasse} onChange={(e) => setNomeClasse(e.target.value)} required placeholder='es. "3ª Media"' />
          </div>
          <button className="acr-btn-primary">Crea classe</button>
        </form>
      )}

      {sezione === 'assegna' && (
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>SCEGLI LA CLASSE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {classi.map((c) => (
              <button key={c.id} className={`chip ${classeSelId === c.id ? 'active' : ''}`} onClick={() => setClasseSelId(c.id)}>
                {c.nome}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>EDUCATORI</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {educatori.map((ed) => {
              const assegnato = assegnatiSel.includes(ed.id)
              return (
                <button
                  key={ed.id}
                  className="acr-card"
                  style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  onClick={() => toggleAssegnazione(ed.id)}
                >
                  <span>{ed.nome}</span>
                  <span className={`acr-mono ${assegnato ? 'acr-pill-signed' : 'acr-pill-unsigned'}`} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20 }}>
                    {assegnato ? 'ASSEGNATO' : 'NON ASSEGNATO'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {sezione === 'ragazzi' && (
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>CLASSE DI DESTINAZIONE</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {classi.map((c) => (
              <button key={c.id} className={`chip ${classeSelId === c.id ? 'active' : ''}`} onClick={() => setClasseSelId(c.id)}>
                {c.nome}
              </button>
            ))}
          </div>
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
            <button className="acr-btn-primary">{ragazzoSalvato ? 'Aggiunto ✓' : 'Salva ragazzo'}</button>
          </form>
        </div>
      )}

      {sezione === 'firma' && (
        <div style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>CLASSI NON ANCORA FIRMATE OGGI</div>
          {nonFirmate.length === 0 && (
            <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Tutte le classi hanno già almeno una firma.</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nonFirmate.map((c) => (
              <div key={c.id} className="acr-card" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <span>{c.nome}</span>
                <button className="acr-btn-primary" style={{ padding: '8px 14px', fontSize: 13, flexShrink: 0 }} onClick={() => firmaPerLoro(c.id)}>
                  Firma per loro
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
