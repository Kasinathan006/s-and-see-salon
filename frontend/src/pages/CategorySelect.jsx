import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClient } from '../context/ClientContext'

const categories = [
  { id: 'hair', icon: '\u2702\uFE0F', label: 'Hair', desc: 'Cut, Color, Style, Treatment' },
  { id: 'skin', icon: '\u2728', label: 'Skin', desc: 'Facial, Glow, Anti-aging' },
  { id: 'scalp', icon: '\uD83E\uDDF4', label: 'Scalp', desc: 'Health, Dandruff, Growth' }
]

export default function CategorySelect() {
  const navigate = useNavigate()
  const { client, setConsultation } = useClient()
  const [selected, setSelected] = useState(null)

  const handleContinue = () => {
    if (!selected) return
    setConsultation({ category: selected, startedAt: new Date().toISOString() })
    navigate('/consultation')
  }

  return (
    <div>
      <div className="header">
        <div className="header-logo">S&S</div>
        <div>
          <h1>Welcome, {client?.name || 'Guest'}</h1>
          <p>What would you like help with today?</p>
        </div>
      </div>

      <div className="page">
        <h2 style={{ fontSize: '1.3rem', marginBottom: 8 }}>Choose Your Category</h2>
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 8 }}>
          Our AI consultant will guide you through personalized recommendations
        </p>

        <div className="category-grid">
          {categories.map(cat => (
            <div
              key={cat.id}
              className={`category-card ${selected === cat.id ? 'active' : ''}`}
              onClick={() => setSelected(cat.id)}
            >
              <div className="category-icon">{cat.icon}</div>
              <h3>{cat.label}</h3>
              <p style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>{cat.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: 12, textAlign: 'center' }}>
            For: Men, Women & Kids
          </p>
          <button
            className="btn btn-primary"
            disabled={!selected}
            onClick={handleContinue}
          >
            Start AI Consultation
          </button>
        </div>
      </div>
    </div>
  )
}
