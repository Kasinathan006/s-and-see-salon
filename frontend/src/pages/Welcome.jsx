import { useNavigate } from 'react-router-dom'
import { Scissors, Sparkles } from 'lucide-react'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="page" style={{
      background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      textAlign: 'center',
      padding: '48px 24px'
    }}>
      <div style={{
        width: 100,
        height: 100,
        background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        boxShadow: '0 0 40px rgba(201,168,76,0.3)'
      }}>
        <Scissors size={48} color="#1A1A2E" />
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>
        S & See
      </h1>
      <h2 style={{ fontSize: '1.2rem', color: '#C9A84C', fontFamily: 'Playfair Display, serif', marginBottom: 8 }}>
        Signature Salon
      </h2>
      <p style={{ color: '#E8D5A3', fontSize: '0.85rem', marginBottom: 48 }}>
        AI-Powered Beauty Experience
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Hair', 'Skin', 'Scalp'].map(cat => (
          <span key={cat} style={{
            padding: '6px 16px',
            border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 20,
            fontSize: '0.8rem',
            color: '#E8D5A3'
          }}>
            <Sparkles size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            {cat}
          </span>
        ))}
      </div>

      <button className="btn btn-primary" style={{ maxWidth: 300 }} onClick={() => navigate('/register')}>
        Get Started
      </button>

      <p style={{ marginTop: 24, fontSize: '0.75rem', color: '#888' }}>
        Avadi, Chennai
      </p>
    </div>
  )
}
