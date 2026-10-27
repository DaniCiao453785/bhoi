import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function SectionHeader({ classeId, titolo }) {
  const navigate = useNavigate()
  return (
    <div className="acr-band" style={{ padding: '20px 20px' }}>
      <button
        onClick={() => navigate(`/classe/${classeId}`)}
        style={{ background: 'none', border: 'none', color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        <ChevronLeft size={18} /> <span style={{ fontSize: 14 }}>Classe</span>
      </button>
      <div className="acr-display" style={{ fontSize: 20, fontWeight: 600 }}>{titolo}</div>
    </div>
  )
}
