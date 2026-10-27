import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, ShieldCheck } from 'lucide-react'
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
    <div style={{ minHeight: '100vh' }}>
      <div className="acr-band" style={{ padding: '28px 20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="acr-display" style={{ fontSize: 24, fontWeight: 600 }}>
              Ciao, {primoNome}
            </div>
            {educatore?.moderatore && <span className="mod-badge"><ShieldCheck size={11} /> MODERATORE</span>}
          </div>
          <div style={{ opacity: 0.9, fontSize: 13, marginTop: 2 }}>Le tue classi</div>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          style={{ background: 'none', border: 'none', color: 'var(--paper)', opacity: 0.9, cursor: 'pointer' }}
        >
          <LogOut size={20} />
        </button>
      </div>

      {educatore?.moderatore && (
        <div style={{ padding: '18px 18px 0' }}>
          <button
            onClick={() => navigate('/aggiunta')}
            style={{ background: 'var(--seal)', color: 'var(--paper)', borderRadius: 4, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', border: 'none', width: '100%', textAlign: 'left' }}
          >
            <Settings size={22} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Aggiunta</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Classi, educatori, ragazzi e correzioni</div>
            </div>
          </button>
        </div>
      )}

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {caricando && <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Caricamento…</div>}
        {!caricando && classi.length === 0 && (
          <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Non sei ancora assegnato a nessuna classe.</div>
        )}
        {classi.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/classe/${c.id}`)}
            className="acr-card"
            style={{ display: 'flex', overflow: 'hidden', textAlign: 'left', cursor: 'pointer', border: '1px solid var(--rule)' }}
          >
            <div className="acr-tab" style={{ background: c.firmataDaMe ? 'var(--sage)' : 'var(--seal)' }} />
            <div style={{ flex: 1, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="acr-display" style={{ fontSize: 17, fontWeight: 600 }}>{c.nome}</div>
                <span
                  className={`acr-mono ${c.firmataDaMe ? 'acr-pill-signed' : 'acr-pill-unsigned'}`}
                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, flexShrink: 0, marginLeft: 8 }}
                >
                  {c.firmataDaMe ? 'FIRMATA' : 'DA FIRMARE'}
                </span>
              </div>
              {c.firmatari.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
                  Hanno firmato: {c.firmatari.join(', ')}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
