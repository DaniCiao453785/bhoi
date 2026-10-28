import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2, CheckCircle2, BookmarkPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SectionHeader from '../components/SectionHeader'

function oggiISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Tematiche() {
  const { id } = useParams()
  const { educatore } = useAuth()
  const [giorno, setGiorno] = useState(oggiISO())
  const [titolo, setTitolo] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [esisteGia, setEsisteGia] = useState(false)
  const [salvato, setSalvato] = useState(false)

  useEffect(() => { carica(giorno) }, [id, giorno])

  async function carica(dataISO) {
    const { data } = await supabase
      .from('tematiche')
      .select('titolo, descrizione')
      .eq('classe_id', id)
      .eq('data', dataISO)
      .maybeSingle()
    if (data) {
      setTitolo(data.titolo)
      setDescrizione(data.descrizione || '')
      setEsisteGia(true)
    } else {
      setTitolo('')
      setDescrizione('')
      setEsisteGia(false)
    }
  }

  async function salva(e) {
    e.preventDefault()
    await supabase.from('tematiche').upsert({
      classe_id: id,
      data: giorno,
      titolo,
      descrizione,
      creata_da: educatore.id,
    }, { onConflict: 'classe_id,data' })
    
    setEsisteGia(true)
    setSalvato(true)
    setTimeout(() => setSalvato(false), 2200)
  }

  async function elimina() {
    if (!window.confirm("Sei sicuro di voler eliminare la tematica di questo giorno?")) return
    await supabase.from('tematiche').delete().eq('classe_id', id).eq('data', giorno)
    setTitolo('')
    setDescrizione('')
    setEsisteGia(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <SectionHeader classeId={id} titolo="Tematica" />

      <div style={{ maxWidth: '640px', margin: '24px auto 0', padding: '0 var(--page-padding)' }}>
        <div className="acr-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase' }}>Seleziona Giorno</label>
            <input className="acr-input" type="date" value={giorno} onChange={(e) => setGiorno(e.target.value)} />
          </div>

          <form onSubmit={salva}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase' }}>Titolo Tematica</label>
              <input className="acr-input" value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. La parabola del seminatore" required />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--ink-soft)', marginBottom: '6px', textTransform: 'uppercase' }}>Descrizione e Note</label>
              <textarea className="acr-input" style={{ resize: 'vertical', minHeight: '120px' }} value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Inserisci i dettagli..." />
            </div>

            <button type="submit" className="acr-btn-primary" style={{ width: '100%', gap: '8px' }}>
              <BookmarkPlus size={18} />
              {esisteGia ? 'Aggiorna tematica' : 'Salva tematica'}
            </button>
          </form>

          {esisteGia && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--rule)', paddingTop: '16px' }}>
              <button type="button" onClick={elimina} style={{ width: '100%', background: 'var(--alert-soft)', border: '1px solid #FEE2E2', color: 'var(--alert)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <Trash2 size={16} /> Elimina tematica di questo giorno
              </button>
            </div>
          )}
        </div>
      </div>

      {salvato && (
        <div className="acr-toast">
          <CheckCircle2 size={20} color="var(--mint)" />
          <span>Tematica salvata con successo!</span>
        </div>
      )}
    </div>
  )
}
