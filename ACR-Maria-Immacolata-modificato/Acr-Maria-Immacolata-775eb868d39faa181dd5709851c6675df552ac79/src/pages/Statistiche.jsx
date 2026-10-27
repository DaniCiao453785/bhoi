import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SectionHeader from '../components/SectionHeader'

export default function Statistiche() {
  const { id } = useParams()
  const [righe, setRighe] = useState([])
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => { carica() }, [id])

  async function carica() {
    setCaricamento(true)
    const { data: ragazzi } = await supabase.from('ragazzi').select('id,nome,cognome').eq('classe_id', id)
    const { data: presenze } = await supabase.from('presenze_ragazzi').select('ragazzo_id,data,presente').eq('classe_id', id).order('data', { ascending: false })
    setRighe((ragazzi || []).map(r => {
      const storico = (presenze || []).filter(p => p.ragazzo_id === r.id)
      const registrate = storico.length
      const assenze = storico.filter(p => p.presente === false).length
      return { ...r, registrate, assenze, presenze: storico.filter(p => p.presente === true).length, percentuale: registrate ? Math.round((registrate - assenze) / registrate * 100) : null }
    }))
    setCaricamento(false)
  }

  return <div style={{minHeight:'100vh'}}>
    <SectionHeader classeId={id} titolo="Statistiche presenze" />
    <div style={{padding:18,display:'flex',flexDirection:'column',gap:12}}>
      <p style={{margin:0,color:'var(--ink-soft)',fontSize:13}}>Riepilogo basato sulle presenze registrate nel sistema.</p>
      {caricamento && <p>Caricamento statistiche…</p>}
      {!caricamento && righe.map(r => <div className="acr-card" key={r.id} style={{padding:16}}>
        <div style={{fontWeight:600}}>{r.nome} {r.cognome}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12}}>
          <div><div style={{fontSize:11,color:'var(--ink-soft)'}}>Presente</div><strong>{r.presenze}</strong></div>
          <div><div style={{fontSize:11,color:'var(--ink-soft)'}}>Assenze</div><strong>{r.assenze}</strong></div>
          <div><div style={{fontSize:11,color:'var(--ink-soft)'}}>Frequenza</div><strong>{r.percentuale === null ? '—' : `${r.percentuale}%`}</strong></div>
        </div>
      </div>)}
      {!caricamento && righe.length === 0 && <p>Nessun ragazzo registrato in questa classe.</p>}
    </div>
  </div>
}
