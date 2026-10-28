import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, PlusCircle, UserCheck, UserPlus, FileCheck, CheckCircle2 } from 'lucide-react'
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
  const [assegnatiSel, setAssegnatiSel] = useState([]) // id degli educatori assegnati
  const [nonFirmate, setNonFirmate] = useState([])

  const [nomeClasse, setNomeClasse] = useState('')

  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [eta, setEta] = useState('')
  const [intolleranze, setIntolleranze] = useState('')
  const [ragazzoSalvato, setRagazzoSalvato] = useState(false)

  useEffect(() => {
    caricaClassi()
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
    setTimeout(() => setRagazzoSalvato(false), 2000)
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      
      {/* Header Band */}
      <div className="acr-band" style={{ padding: '24px 20px 28px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            border: 'none',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 'var(--radius-pill)',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          <ChevronLeft size={16} /> Home
        </button>
        <div className="acr-display" style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
          Gestione Moderatore
        </div>
        <div style={{ opacity: 0.85, fontSize: '13px', marginTop: '2px', fontFamily: 'Inter, sans-serif' }}>
          Configura classi, educatori e correzioni di sistema
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '20px auto 0', padding: '0 var(--page-padding)', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Selettore Tab / Chip */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'classi', label: 'Nuova classe', icon: PlusCircle },
            { key: 'assegna', label: 'Assegna educatori', icon: UserCheck },
            { key: 'ragazzi', label: 'Aggiungi ragazzo', icon: UserPlus },
            { key: 'firma', label: 'Firma per loro', icon: FileCheck },
          ].map((s) => {
            const Icon = s.icon
            const isActive = sezione === s.key
            return (
              <button
                key={s.key}
                className={`chip ${isActive ? 'active' : ''}`}
                onClick={() => setSezione(s.key)}
              >
                <Icon size={15} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* 1. SEZIONE NUOVA CLASSE */}
        {sezione === 'classi' && (
          <form onSubmit={creaClasse} className="acr-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--anthracite)' }}>
              Crea una Nuova Classe
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Nome della classe *
              </label>
              <input
                className="acr-input"
                value={nomeClasse}
                onChange={(e) => setNomeClasse(e.target.value)}
                required
                placeholder='es. "3ª Media" o "Gruppo Giovanissimi"'
              />
            </div>
            <button type="submit" className="acr-btn-primary">
              Crea classe
            </button>
          </form>
        )}

        {/* 2. SEZIONE ASSEGNA EDUCATORI */}
        {sezione === 'assegna' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="acr-card" style={{ padding: '18px 20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                1. Scegli la classe
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {classi.map((c) => (
                  <button
                    key={c.id}
                    className={`chip ${classeSelId === c.id ? 'active' : ''}`}
                    onClick={() => setClasseSelId(c.id)}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="acr-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                2. Assegna gli educatori alla classe selezionata
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                {educatori.map((ed) => {
                  const assegnato = assegnatiSel.includes(ed.id)
                  return (
                    <button
                      key={ed.id}
                      className="acr-card"
                      style={{
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                      onClick={() => toggleAssegnazione(ed.id)}
                    >
                      <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', fontSize: '15px', color: 'var(--anthracite)' }}>
                        {ed.nome}
                      </span>
                      <span className={`acr-mono ${assegnato ? 'acr-pill-signed' : 'acr-pill-unsigned'}`}>
                        {assegnato ? 'ASSEGNATO' : 'NON ASSEGNATO'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}

        {/* 3. SEZIONE AGGIUNGI RAGAZZO */}
        {sezione === 'ragazzi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="acr-card" style={{ padding: '18px 20px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Classe di destinazione
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {classi.map((c) => (
                  <button
                    key={c.id}
                    className={`chip ${classeSelId === c.id ? 'active' : ''}`}
                    onClick={() => setClasseSelId(c.id)}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={aggiungiRagazzo} className="acr-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--anthracite)' }}>
                Dettagli Partecipante
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Nome *</label>
                  <input className="acr-input" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Es. Marco" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Cognome *</label>
                  <input className="acr-input" value={cognome} onChange={(e) => setCognome(e.target.value)} required placeholder="Es. Rossi" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Età</label>
                  <input className="acr-input" type="number" min="0" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="Es. 10" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Intolleranze (opzionale)</label>
                  <input className="acr-input" value={intolleranze} onChange={(e) => setIntolleranze(e.target.value)} placeholder="Es. Lattosio" />
                </div>
              </div>

              <button type="submit" className="acr-btn-primary">
                Salva ragazzo nel registro
              </button>
            </form>

          </div>
        )}

        {/* 4. SEZIONE FIRMA PER LORO */}
        {sezione === 'firma' && (
          <div className="acr-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '16px', fontWeight: '700', color: 'var(--anthracite)' }}>
                Firma Correttiva Moderatore
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ink-soft)' }}>
                Classi che non risultano ancora firmate nella giornata di oggi.
              </p>
            </div>

            {nonFirmate.length === 0 && (
              <div style={{ color: 'var(--sage)', fontWeight: '600', fontSize: '14px', background: 'var(--sage-soft)', padding: '14px 16px', borderRadius: 'var(--radius-sm)', marginTop: '6px' }}>
                ✓ Tutte le classi sono state regolarmente firmate oggi!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {nonFirmate.map((c) => (
                <div
                  key={c.id}
                  className="acr-card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}
                >
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '700', fontSize: '15px', color: 'var(--anthracite)' }}>
                    {c.nome}
                  </span>
                  <button
                    className="acr-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px', minHeight: '38px' }}
                    onClick={() => firmaPerLoro(c.id)}
                  >
                    Firma per loro
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Toast di Conferma Inserimento */}
      {ragazzoSalvato && (
        <div className="acr-toast">
          <CheckCircle2 size={20} color="var(--mint)" />
          <span>Ragazzo aggiunto con successo!</span>
        </div>
      )}

    </div>
  )
}
