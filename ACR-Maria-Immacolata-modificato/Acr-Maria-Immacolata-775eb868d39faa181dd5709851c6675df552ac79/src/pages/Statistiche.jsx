import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, Users } from 'lucide-react'
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
      return { 
        ...r, 
        registrate, 
        assenze, 
        presenze: storico.filter(p => p.presente === true).length, 
        percentuale: registrate ? Math.round((registrate - assenze) / registrate * 100) : null 
      }
    }))
    setCaricamento(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <SectionHeader classeId={id} titolo="Statistiche presenze" />

      <div style={{ maxWidth: '720px', margin: '24px auto 0', padding: '0 var(--page-padding)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--ink-soft)' }}>
          <BarChart3 size={18} color="var(--purple)" />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Riepilogo basato sulle presenze registrate nel sistema.</span>
        </div>

        {caricamento && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="acr-card" style={{ padding: '20px' }}>
                <div className="acr-skeleton acr-skeleton-title" style={{ width: '45%' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                  <div className="acr-skeleton acr-skeleton-text" style={{ height: '36px', width: '100%' }}></div>
                  <div className="acr-skeleton acr-skeleton-text" style={{ height: '36px', width: '100%' }}></div>
                  <div className="acr-skeleton acr-skeleton-text" style={{ height: '36px', width: '100%' }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!caricamento && righe.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {righe.map((r) => (
              <div key={r.id} className="stat-card" style={{ padding: '20px' }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '700', fontSize: '16px', color: 'var(--anthracite)' }}>
                  {r.nome} {r.cognome}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '14px', background: 'var(--surface-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--rule)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Presente</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--sage)', marginTop: '2px' }}>{r.presenze}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Assenze</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--alert)', marginTop: '2px' }}>{r.assenze}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>Frequenza</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '18px', fontWeight: '700', color: 'var(--purple)', marginTop: '2px' }}>{r.percentuale === null ? '—' : `${r.percentuale}%`}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!caricamento && righe.length === 0 && (
          <div className="acr-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Users size={32} color="var(--ink-soft)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', color: 'var(--anthracite)' }}>Nessun ragazzo registrato</span>
          </div>
        )}
      </div>
    </div>
  )
}
