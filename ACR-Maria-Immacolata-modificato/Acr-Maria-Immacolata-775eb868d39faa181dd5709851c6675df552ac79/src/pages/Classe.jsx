import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Check, PenLine, Users, ClipboardList, BookOpen, Calendar } from 'lucide-react'
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

  // giorno su cui si sta firmando: di default oggi, ma si può scegliere
  // qualsiasi altro giorno dal calendario
  const [giornoFirma, setGiornoFirma] = useState(oggiISO())
  const [firmataDaMe, setFirmataDaMe] = useState(false)
  const [firmatari, setFirmatari] = useState([])
  const [firmando, setFirmando] = useState(false)

  // stato "oggi" separato: serve solo per sapere se la gestione è sbloccata
  const [qualcunoHaFirmatoOggi, setQualcunoHaFirmatoOggi] = useState(false)

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
      // firmare implica essere presenti quel giorno: aggiorna anche le presenze educatori
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

  const sbloccaGestione = true

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="acr-band" style={{ padding: '20px 20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0, marginBottom: 14 }}
        >
          <ChevronLeft size={18} /> <span style={{ fontSize: 14 }}>Classi</span>
        </button>
        <div className="acr-display" style={{ fontSize: 22, fontWeight: 600 }}>{classe.nome}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 18px 4px' }}>
        <div className="stamp-wrap-sm">
          <button
            className="stamp-btn-sm"
            disabled={!firmaConsentita || (firmataDaMe && !isModerator) || firmando}
            onClick={handleFirma}
            title={isModerator && firmataDaMe ? 'Rifirma come moderatore' : undefined}
          >
            {firmataDaMe ? (isModerator ? <PenLine size={20} /> : '') : 'FIRMA'}
          </button>
          {firmataDaMe && !isModerator && (
            <div className="stamp-mark-sm">
              <Check size={22} />
            </div>
          )}
        </div>
        <div>
          {!firmaConsentita && <div style={{fontSize:12,color:'var(--alert)',marginBottom:4}}>La firma è disponibile solo per sabato e domenica.</div>}
          <div className="acr-mono" style={{ fontSize: 11, color: firmataDaMe ? 'var(--sage)' : 'var(--seal-dark)' }}>
            {firmataDaMe ? `HAI FIRMATO ${formattaData(giornoFirma).toUpperCase()}` : `DA FIRMARE ${formattaData(giornoFirma).toUpperCase()}`}
          </div>
          {firmatari.length > 0 && (
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
              Hanno firmato: {firmatari.join(', ')}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>
            Seleziona sabato o domenica per firmare
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 0 0' }}>
        <CalendarioComune classeId={id} onSelectDay={setGiornoFirma} />
      </div>

      {sbloccaGestione && (
        <div style={{ padding: '0 18px 30px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10, textAlign: 'center' }}>GESTIONE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {GESTIONE.map(({ path, label, icon: Icon }) => (
              <button key={path} className="mgmt-card" onClick={() => navigate(`/classe/${id}/${path}`)}>
                <Icon size={20} color="var(--seal-dark)" />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
