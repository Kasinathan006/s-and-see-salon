import { useState, useEffect } from 'react'
import { Scissors, Sparkles } from 'lucide-react'

const STYLE_SUGGESTIONS = {
  hair: [
    { title: 'Layered Bob', desc: 'Modern layered bob with subtle highlights', color: '#E8D5A3' },
    { title: 'Classic Fade', desc: 'Clean fade with textured top', color: '#C9A84C' },
    { title: 'Caramel Highlights', desc: 'Warm caramel tones for a sun-kissed look', color: '#A88B3D' },
    { title: 'Bridal Updo', desc: 'Elegant updo with floral accents', color: '#E8D5A3' }
  ],
  skin: [
    { title: 'Glass Skin', desc: 'Dewy, luminous skin treatment', color: '#E8D5A3' },
    { title: 'Gold Facial Glow', desc: 'Premium gold-infused radiance', color: '#C9A84C' },
    { title: 'Anti-Aging Rejuvenation', desc: 'Youth-restoring treatment', color: '#A88B3D' },
    { title: 'Hydra Boost', desc: 'Deep hydration therapy', color: '#E8D5A3' }
  ],
  scalp: [
    { title: 'Scalp Detox', desc: 'Deep cleansing treatment', color: '#E8D5A3' },
    { title: 'Hair Growth Boost', desc: 'Stimulate natural growth', color: '#C9A84C' },
    { title: 'Dandruff Control', desc: 'Long-lasting dandruff solution', color: '#A88B3D' },
    { title: 'Stress Relief', desc: 'Relaxing scalp massage therapy', color: '#E8D5A3' }
  ]
}

export default function TVDisplay() {
  const [activeCategory, setActiveCategory] = useState('hair')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    const catTimer = setInterval(() => {
      setActiveCategory(prev => {
        const cats = ['hair', 'skin', 'scalp']
        const idx = cats.indexOf(prev)
        return cats[(idx + 1) % cats.length]
      })
    }, 10000)
    return () => { clearInterval(timer); clearInterval(catTimer) }
  }, [])

  return (
    <div className="tv-display">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 48 }}>
        <div style={{
          width: 80, height: 80,
          background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(201,168,76,0.3)'
        }}>
          <Scissors size={40} color="#1A1A2E" />
        </div>
        <div>
          <h1 style={{ fontSize: '3rem', color: '#C9A84C' }}>S & See Signature Salon</h1>
          <p style={{ color: '#E8D5A3', fontSize: '1.2rem' }}>
            AI-Powered Beauty Experience | Avadi, Chennai
          </p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', color: '#C9A84C', fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString('en-IN')}
          </div>
          <div style={{ color: '#888', fontSize: '1rem' }}>
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {['hair', 'skin', 'scalp'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '12px 32px',
              borderRadius: 24,
              border: `2px solid ${activeCategory === cat ? '#C9A84C' : 'rgba(255,255,255,0.2)'}`,
              background: activeCategory === cat ? '#C9A84C' : 'transparent',
              color: activeCategory === cat ? '#1A1A2E' : 'white',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Style Grid */}
      <div className="visualization-grid">
        {STYLE_SUGGESTIONS[activeCategory].map((style, i) => (
          <div key={i} className="visualization-card">
            <div style={{
              width: '100%',
              height: 200,
              background: `linear-gradient(135deg, ${style.color}22, ${style.color}44)`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Sparkles size={64} color={style.color} />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: '#C9A84C', marginBottom: 8 }}>{style.title}</h3>
            <p style={{ color: '#aaa', fontSize: '0.95rem' }}>{style.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, textAlign: 'center', color: '#888' }}>
        <p style={{ fontSize: '1rem' }}>
          <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Powered by AI | Ask our consultant for personalized recommendations
        </p>
      </div>
    </div>
  )
}
