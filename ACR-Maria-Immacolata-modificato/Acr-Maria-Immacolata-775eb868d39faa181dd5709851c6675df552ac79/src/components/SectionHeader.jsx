import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function SectionHeader({ classeId, titolo }) {
  const navigate = useNavigate()
  
  return (
    <div className="acr-band" style={{ padding: '24px 20px 28px' }}>
      <button
        onClick={() => navigate(`/classe/${classeId}`)}
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
          fontWeight: '600',
          transition: 'background 160ms ease'
        }}
      >
        <ChevronLeft size={16} /> Torna alla Classe
      </button>
      <div className="acr-display" style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF' }}>
        {titolo}
      </div>
    </div>
  )
}
