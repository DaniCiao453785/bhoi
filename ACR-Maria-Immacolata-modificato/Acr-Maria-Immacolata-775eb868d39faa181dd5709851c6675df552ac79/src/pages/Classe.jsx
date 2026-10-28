import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Check, PenLine, Users, ClipboardList, BookOpen, Calendar, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { ordinaStringhe } from '../lib/ordinaNomi'
import CalendarioComune from '../components/CalendarioComune'

function oggiISO() {
  return new Date().toISOString().slice(0, 10)
}

function formattaData(iso) {
  if (iso === oggiISO()) return 'oggi'
  const d = new Date(iso + 'T00:00:00')
  return 'il ' + d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

const GESTIONE = [
  { path: 'presenze-educatori', label: 'Presenze educatori', icon: Users },
  { path: 'presenze-ragazzi', label: 'Presenze', icon: ClipboardList },
  { path: 'statistiche', label: 'Statistiche', icon: Calendar },
  { path: 'tematiche', label: 'Tematiche', icon: BookOpen },
  { path: 'ragazzi', label: 'Elenco ragazzi', icon: Calendar },
]

export default function Classe() {
  const { id } = useParams()
  const { educatore } = useAuth()
  const navigate = useNavigate()
  const [classe, setClasse] = useState(null)
  const isModerator = !!educatore?.moderatore

  const [giornoFirma, setGiornoFirma] = useState(oggiISO())
  const [firmataDaMe, setFirmataDaMe] = useState(false)
  const [firmatari, setFirmatari] = useState([])
  const [firmando, setFirmando] = useState(false)
  const [, setQualcunoHaFirmatoOggi] = useState(false)

  useEffect(() => {
    supabase.from('classi').select('*').eq('id', id).single().then(({ data }) => setClasse(data))
    caricaStatoOggi()
  }, [id])

  useEffect(() => {
    caricaFirmeGiorno(giornoFirma)
  }, [id, giornoFirma])

  async function caricaStatoOggi() {
    const { data } = await supabase.from('firme').select('id').eq('classe_id', id).eq('data', oggiISO())
    setQualcunoHaFirmatoOggi((data || []).length > 0)
  }

  async function caricaFirmeGiorno(dataISO) {
    const { data } = await supabase
      .from('firme')
      .select('educatore_id, educatore:educatori(nome)')
      .eq('classe_id', id)
      .eq('data', dataISO)
    const righe = data || []
    setFirmataDaMe(righe.some((f) => f.educatore_id === educatore.id))
    setFirmatari(ordinaStringhe(righe.map((f) => f.educatore?.nome ?? '').filter(Boolean)))
  }

  const giornoSelezionato = new Date(giornoFirma + 'T12:00:00').getDay()
  const firmaConsentita = giornoSelezionato === 0 || giornoSelezionato === 6

  async function handleFirma() {
    if (!firmaConsentita || (firmataDaMe && !isModerator) || firmando) return
    setFirmando(true)
    const { error } = await supabase.from('firme').upsert({
      classe_id: id,
      educatore_id: educatore.id,
      data: giornoFirma,
    }, { onConflict: 'classe_id,educatore_id,data' })

    if (!error) {
      await supabase.from('presenze_educatori').upsert({
        classe_id: id,
        educatore_id: educatore.id,
        data: giornoFirma,
        presente: true,
      }, { onConflict: 'classe_id,educatore_id,data' })
      await caricaFirmeGiorno(giornoFirma)
      if (giornoFirma === oggiISO()) caricaStatoOggi()
    }
    setFirmando(false)
  }

  if (!classe) return null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <div className="acr-band" style={{ padding: '24px 20px 28px' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255, 255, 255, 0.12)', border: 'none', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius-pill)', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
          <ChevronLeft size={16} /> Tutte le Classi
        </button>
        <div className="acr-display" style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>{classe.nome}</div>
      </div>

      <div style={{ maxWidth: '680px', margin: '24px auto 0', padding: '0 var(--page-padding)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="acr-card" style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          <div className="stamp-wrap-sm">
            <button className="stamp-btn-sm" disabled={!firmaConsentita || (firmataDaMe && !isModerator) || firmando} onClick={handleFirma} title={isModerator && firmataDaMe ? 'Rifirma come moderatore' : undefined}>
              {firmataDaMe ? (isModerator ? <PenLine size={22} color="var(--anthracite)" /> : '') : 'FIRMA'}
            </button>
            {firmataDaMe && !isModerator && (
              <div className="stamp-mark-sm"><Check size={24} /></div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            {!firmaConsentita && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: 'var(--coral)', background: 'rgba(255, 92, 92, 0.1)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', marginBottom: '8px' }}>
                <AlertCircle size={13} /> Firma attiva solo Sabato e Domenica
              </div>
            )}
            <div className="acr-mono" style={{ fontSize: '12px', fontWeight: '700', color: firmataDaMe ? 'var(--sage)' : 'var(--purple-dark)' }}>
              {firmataDaMe ? `HAI FIRMATO ${formattaData(giornoFirma).toUpperCase()}` : `DA FIRMARE ${formattaData(giornoFirma).toUpperCase()}`}
            </div>
            {firmatari.length > 0 && (
              <div style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '4px', fontWeight: '500' }}>
                Hanno firmato: <strong style={{ color: 'var(--anthracite)' }}>{firmatari.join(', ')}</strong>
              </div>
            )}
          </div>
        </div>

        <div><CalendarioComune classeId={id} onSelectDay={setGiornoFirma} /></div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px', textAlign: 'center' }}>Pannello Gestione</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            {GESTIONE.map(({ path, label, icon: Icon }) => (
              <button key={path} className="mgmt-card" onClick={() => navigate(`/classe/${id}/${path}`)}>
                <div style={{ background: 'var(--brand-soft)', width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', display: 'grid', placeItems: 'center' }}>
                  <Icon size={20} color="var(--purple)" />
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--anthracite)', marginTop: '4px' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
