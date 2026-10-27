import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
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

  useEffect(() => {
    carica(giorno)
  }, [id, giorno])

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
    // il form si svuota, pronto per scrivere una nuova tematica
    setTitolo('')
    setDescrizione('')
    setSalvato(true)
    setTimeout(() => setSalvato(false), 1800)
  }

  async function elimina() {
    await supabase.from('tematiche').delete().eq('classe_id', id).eq('data', giorno)
    setTitolo('')
    setDescrizione('')
    setEsisteGia(false)
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <SectionHeader classeId={id} titolo="Tematica" />
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
      <form onSubmit={salva} style={{ padding: 18 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Titolo</label>
          <input className="acr-input" value={titolo} onChange={(e) => setTitolo(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Descrizione</label>
          <textarea
            className="acr-input"
            style={{ resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }}
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
          />
        </div>
        <button className="acr-btn-primary" style={{ width: '100%' }}>
          {salvato ? 'Salvato ✓' : (esisteGia ? 'Aggiorna tematica' : 'Salva tematica')}
        </button>
        {esisteGia && (
          <button
            type="button"
            onClick={elimina}
            style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: 'var(--alert)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', fontWeight: 500, padding: 10 }}
          >
            <Trash2 size={15} /> Elimina tematica di questo giorno
          </button>
        )}
      </form>
    </div>
  )
}
