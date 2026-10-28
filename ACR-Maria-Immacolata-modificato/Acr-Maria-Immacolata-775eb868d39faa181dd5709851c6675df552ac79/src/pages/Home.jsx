import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, ShieldCheck, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ordinaStringhe } from '../lib/ordinaNomi'
import { ordinaClassi } from '../lib/ordinaClassi'

function oggiISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function Home() {
  const { educatore, logout } = useAuth()
  const navigate = useNavigate()
  const [classi, setClassi] = useState([])
  const [caricando, setCaricando] = useState(true)

  useEffect(() => {
    if (!educatore) return
    caricaClassi()
  }, [educatore])

  async function caricaClassi() {
    setCaricando(true)
    let classiBase = []

    if (educatore.moderatore) {
      const { data } = await supabase.from('classi').select('*')
      classiBase = ordinaClassi(data || [])
    } else {
      const { data: assegnazioni } = await supabase
        .from('classe_educatori')
        .select('classe:classi(*)')
        .eq('educatore_id', educatore.id)
      classiBase = ordinaClassi((assegnazioni || []).map((a) => a.classe).filter(Boolean))
    }

    const ids = classiBase.map((c) => c.id)
    let firmeOggi = []
    if (ids.length) {
      const { data } = await supabase
        .from('firme')
        .select('classe_id, educatore_id, educatore:educatori(nome)')
        .in('classe_id', ids)
        .eq('data', oggiISO())
      firmeOggi = data || []
    }

    const arricchite = classiBase.map((c) => {
      const firmeClasse = firmeOggi.filter((f) => f.classe_id === c.id)
      return {
        ...c,
        firmataDaMe: firmeClasse.some((f) => f.educatore_id === educatore.id),
        firmatari: ordinaStringhe(firmeClasse.map((f) => f.educatore?.nome ?? '').filter(Boolean)),
      }
    })

    setClassi(arricchite)
    setCaricando(false)
  }

  const primoNome = educatore?.nome?.split(' ')[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <div className="acr-band" style={{ padding: '36px 24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="acr-display" style={{ fontSize: '26px', fontWeight: '700', color: '#FFFFFF' }}>Ciao, {primoNome}</div>
            {educatore?.moderatore && <span className="mod-badge"><ShieldCheck size={13} /> MODERATORE</span>}
          </div>
          <div style={{ opacity: 0.85, fontSize: '13px', marginTop: '4px', fontFamily: 'Inter, sans-serif' }}>Le tue classi e registri di oggi</div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 'var(--radius-sm)', color: '#FFFFFF', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Esci">
          <LogOut size={18} />
        </button>
      </div>

      <div style={{ maxWidth: '680px', margin: '24px auto 0', padding: '0 var(--page-padding)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {educatore?.moderatore && (
          <button onClick={() => navigate('/aggiunta')} className="acr-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', background: 'linear-gradient(135deg, var(--purple) 0%, var(--purple-dark) 100%)', color: '#FFFFFF', border: 'none', width: '100%', textAlign: 'left' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center' }}><Settings size={22} color="#FFFFFF" /></div>
            <div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '700', fontSize: '16px' }}>Pannello Gestione</div>
              <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '2px' }}>Classi, educatori, ragazzi e correzioni di sistema</div>
            </div>
          </button>
        )}

        {caricando && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[1, 2].map((n) => (
              <div key={n} className="acr-card" style={{ padding: '20px' }}>
                <div className="acr-skeleton acr-skeleton-title" style={{ width: '50%' }}></div>
                <div className="acr-skeleton acr-skeleton-text" style={{ width: '80%', marginTop: '12px' }}></div>
              </div>
            ))}
          </div>
        )}

        {!caricando && classi.length === 0 && (
          <div className="acr-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={32} color="var(--ink-soft)" />
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '600', color: 'var(--anthracite)' }}>Nessuna classe assegnata</span>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink-soft)' }}>Al momento non risulti assegnato ad alcuna classe.</p>
          </div>
        )}

        {!caricando && classi.map((c) => (
          <button key={c.id} onClick={() => navigate(`/classe/${c.id}`)} className="acr-card" style={{ display: 'flex', overflow: 'hidden', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--rule)', padding: 0, width: '100%' }}>
            <div className="acr-tab" style={{ background: c.firmataDaMe ? 'var(--sage)' : 'var(--purple)', width: '6px' }} />
            <div style={{ flex: 1, padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div className="acr-display" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--anthracite)' }}>{c.nome}</div>
                <span className={`acr-mono ${c.firmataDaMe ? 'acr-pill-signed' : 'acr-pill-unsigned'}`}>{c.firmataDaMe ? 'FIRMATA' : 'DA FIRMARE'}</span>
              </div>
              {c.firmatari.length > 0 && (
                <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ink-soft)', marginTop: '10px' }}>
                  Hanno firmato oggi: <strong>{c.firmatari.join(', ')}</strong>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
