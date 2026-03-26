import { useState, useEffect, useRef } from 'react'
import { Scissors, Sparkles, Search, X, User, Camera, Tv } from 'lucide-react'

// ===== HAIRSTYLE FILTER PRESETS (applied as CSS filters on the real photo) =====
const HAIR_STYLES = [
  {
    title: 'Natural Black',
    desc: 'Deep jet black with rich shine',
    filter: 'grayscale(0.2) contrast(1.15) brightness(0.85)',
    overlay: 'rgba(15,12,30,0.25)',
    badge: '🖤', color: '#333'
  },
  {
    title: 'Caramel Highlights',
    desc: 'Warm caramel sun-kissed tones',
    filter: 'sepia(0.55) saturate(1.6) hue-rotate(12deg) brightness(1.05)',
    overlay: 'rgba(180,120,30,0.12)',
    badge: '🍯', color: '#C9A84C'
  },
  {
    title: 'Rose Gold',
    desc: 'Trendy warm rose metallic',
    filter: 'sepia(0.35) saturate(2) hue-rotate(320deg) brightness(1.1)',
    overlay: 'rgba(200,100,100,0.1)',
    badge: '🌹', color: '#E8A0A0'
  },
  {
    title: 'Ash Silver',
    desc: 'Cool ash to icy silver tones',
    filter: 'grayscale(0.65) brightness(1.18) contrast(0.92) saturate(0.5)',
    overlay: 'rgba(180,190,200,0.15)',
    badge: '🌙', color: '#A8B0C0'
  },
  {
    title: 'Deep Burgundy',
    desc: 'Rich bold wine-red luxury',
    filter: 'sepia(0.9) saturate(2.4) hue-rotate(295deg) brightness(0.82)',
    overlay: 'rgba(120,20,40,0.18)',
    badge: '🍷', color: '#8B1A2C'
  },
  {
    title: 'Copper Bronze',
    desc: 'Warm metallic copper depth',
    filter: 'sepia(0.6) saturate(2) hue-rotate(22deg) brightness(1.02)',
    overlay: 'rgba(180,90,30,0.14)',
    badge: '🥉', color: '#B05820'
  },
]

const FACE_FILTERS = [
  { title: 'Glass Skin', desc: 'Dewy luminous radiance', filter: 'brightness(1.12) contrast(0.95) saturate(1.1)', overlay: 'rgba(220,240,255,0.08)', badge: '🌟', color: '#80C0FF' },
  { title: 'Gold Glow', desc: 'Premium gold-infused glow', filter: 'sepia(0.2) brightness(1.1) saturate(1.3)', overlay: 'rgba(201,168,76,0.1)', badge: '✨', color: '#C9A84C' },
  { title: 'Natural Beauty', desc: 'Soft enhanced natural look', filter: 'brightness(1.06) saturate(1.15) contrast(0.97)', overlay: 'rgba(255,220,200,0.05)', badge: '🌸', color: '#FFB8A0' },
  { title: 'Matte Finish', desc: 'Flawless matte complexion', filter: 'brightness(0.96) contrast(1.08) saturate(0.9)', overlay: 'rgba(240,230,210,0.06)', badge: '💎', color: '#D4C8B8' },
]

const FILTER_TABS = [
  { key: 'hairstyle', label: '💇 Hair Styles' },
  { key: 'facefilter', label: '🧖 Face Filters' },
]

export default function TVDisplay() {
  const [activeFilter, setActiveFilter] = useState('hairstyle')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedStyle, setSelectedStyle] = useState(0)

  // Client photo state
  const [clientPhoto, setClientPhoto] = useState(null)
  const [clientName, setClientName] = useState(null)
  const [clientCategory, setClientCategory] = useState('hair')

  const searchRef = useRef(null)

  // ===== READ PHOTO FROM LOCALSTORAGE + POLL FOR UPDATES =====
  useEffect(() => {
    const loadClientData = () => {
      try {
        const photo = localStorage.getItem('salon_tv_photo')
        const name = localStorage.getItem('salon_tv_client_name')
        const cat = localStorage.getItem('salon_tv_category')
        if (photo && photo !== clientPhoto) {
          setClientPhoto(photo)
          if (cat === 'hair' || cat === 'hairstyle') setActiveFilter('hairstyle')
          else if (cat === 'skin') setActiveFilter('facefilter')
        }
        if (name) setClientName(name)
        if (cat) setClientCategory(cat)
      } catch (e) { /* ignore */ }
    }
    loadClientData()
    const poller = setInterval(loadClientData, 2000)
    return () => clearInterval(poller)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto cycle through styles when client photo is present
  useEffect(() => {
    if (!clientPhoto) return
    const styles = activeFilter === 'hairstyle' ? HAIR_STYLES : FACE_FILTERS
    const t = setInterval(() => setSelectedStyle(p => (p + 1) % styles.length), 4000)
    return () => clearInterval(t)
  }, [clientPhoto, activeFilter])

  const styles = activeFilter === 'hairstyle' ? HAIR_STYLES : FACE_FILTERS

  const filteredStyles = searchQuery
    ? styles.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : styles

  const currentStyle = styles[selectedStyle % styles.length]

  return (
    <div style={{
      minHeight: '100vh',
      maxHeight: '100vh',
      background: 'linear-gradient(135deg, #07070f 0%, #1A1A2E 40%, #0F3460 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>

      {/* ===== HEADER ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '16px 40px',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(201,168,76,0.5)',
          flexShrink: 0,
        }}>
          <Scissors size={24} color="#1A1A2E" />
        </div>

        <div style={{ flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#C9A84C', fontFamily: 'Playfair Display, serif' }}>
            S &amp; See Signature Salon
          </h1>
          <p style={{ margin: 0, color: '#E8D5A3', fontSize: '0.72rem' }}>
            AI-Powered Beauty Experience | Avadi, Chennai
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 10, marginLeft: 24 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setSelectedStyle(0) }}
              style={{
                padding: '8px 18px',
                borderRadius: 20,
                border: `2px solid ${activeFilter === tab.key ? '#C9A84C' : 'rgba(255,255,255,0.15)'}`,
                background: activeFilter === tab.key ? 'linear-gradient(135deg, #C9A84C, #A88B3D)' : 'rgba(255,255,255,0.05)',
                color: activeFilter === tab.key ? '#1A1A2E' : 'white',
                fontSize: '0.82rem',
                fontWeight: activeFilter === tab.key ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                whiteSpace: 'nowrap',
                boxShadow: activeFilter === tab.key ? '0 4px 15px rgba(201,168,76,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 260, marginLeft: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C9A84C' }} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search styles..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '9px 36px 9px 36px',
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(201,168,76,0.35)',
              borderRadius: 24, color: 'white', fontSize: '0.82rem',
              fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Clock */}
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.5rem', color: '#C9A84C', fontFamily: 'monospace', fontWeight: 700 }}>
            {currentTime.toLocaleTimeString('en-IN')}
          </div>
          <div style={{ color: '#666', fontSize: '0.65rem' }}>
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ===== MAIN BODY ===== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ===== LEFT: CLIENT PHOTO PANEL ===== */}
        {clientPhoto ? (
          <div style={{
            width: 380,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(201,168,76,0.2)',
            background: 'rgba(0,0,0,0.25)',
            padding: '20px 18px',
            gap: 12,
            overflowY: 'auto',
          }}>
            {/* Live Client Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: 20, padding: '5px 14px',
                fontSize: '0.7rem', color: '#C9A84C', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4CAF50', animation: 'pulse 1.5s infinite' }} />
                Live Client Preview
              </div>
            </div>

            {/* ===== PHOTO WITH LIVE STYLE FILTER ===== */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', border: '3px solid #C9A84C', boxShadow: `0 0 40px ${currentStyle.color}55` }}>
              {/* Base photo */}
              <img
                src={clientPhoto}
                alt="Client"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  filter: currentStyle.filter,
                  transition: 'filter 1.2s ease',
                }}
              />
              {/* Color overlay tint */}
              <div style={{
                position: 'absolute', inset: 0,
                background: currentStyle.overlay,
                transition: 'background 1.2s ease',
                pointerEvents: 'none',
              }} />
              {/* Style label on photo */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                padding: '30px 16px 14px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 2 }}>{currentStyle.badge}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#C9A84C' }}>{currentStyle.title}</div>
                <div style={{ fontSize: '0.7rem', color: '#ccc', marginTop: 2 }}>{currentStyle.desc}</div>
              </div>
            </div>

            {/* Client Info */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <User size={14} /> {clientName || 'Client'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: 4 }}>
                {clientCategory === 'hair' || clientCategory === 'hairstyle' ? '💇 Hair Consultation' : clientCategory === 'skin' ? '🧖 Skin Consultation' : '🌿 Scalp Treatment'}
              </div>
            </div>

            {/* Style progress dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {styles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedStyle(i)}
                  style={{
                    width: selectedStyle % styles.length === i ? 20 : 8,
                    height: 8, borderRadius: 4,
                    background: selectedStyle % styles.length === i ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* NO PHOTO: Show placeholder prompt */
          <div style={{
            width: 300, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRight: '1px solid rgba(201,168,76,0.1)',
            background: 'rgba(0,0,0,0.2)',
            padding: 28, gap: 16, textAlign: 'center',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '2px dashed rgba(201,168,76,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={32} color="rgba(201,168,76,0.4)" />
            </div>
            <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: 1.6 }}>
              Take a photo on the<br />consultation tablet and<br />click <strong style={{ color: '#C9A84C' }}>"Show on TV"</strong><br />to see live style previews here
            </p>
            <Tv size={20} color="rgba(201,168,76,0.3)" />
          </div>
        )}

        {/* ===== RIGHT: STYLE CARDS GRID ===== */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Section title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Sparkles size={16} color="#C9A84C" />
            <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              {activeFilter === 'hairstyle' ? 'Hair Style Catalog' : 'Face Treatment Catalog'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#555', marginLeft: 'auto' }}>
              {filteredStyles.length} styles
            </span>
          </div>

          {/* Style grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
            gap: 14,
          }}>
            {filteredStyles.map((style, i) => {
              const isActive = i === (selectedStyle % styles.length) && clientPhoto
              return (
                <div
                  key={style.title}
                  onClick={() => setSelectedStyle(styles.indexOf(style))}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))'
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.1)'}`,
                    borderRadius: 14,
                    padding: '16px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 20px ${style.color}44` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Photo preview with filter (if client photo exists) */}
                  {clientPhoto ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2', borderRadius: 8, overflow: 'hidden', marginBottom: 10, border: `1.5px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.15)'}` }}>
                      <img
                        src={clientPhoto}
                        alt={style.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: style.filter, transition: 'filter 0.8s ease' }}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: style.overlay, pointerEvents: 'none' }} />
                    </div>
                  ) : (
                    <div style={{
                      width: '100%', aspectRatio: '3/2', borderRadius: 8,
                      background: `linear-gradient(135deg, ${style.color}22, ${style.color}44)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 10, fontSize: '2.2rem',
                    }}>
                      {style.badge}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.1rem' }}>{style.badge}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isActive ? '#C9A84C' : '#ddd', fontFamily: 'Playfair Display, serif' }}>
                      {style.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.68rem', color: '#777', margin: 0, lineHeight: 1.5 }}>
                    {style.desc}
                  </p>

                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: '#C9A84C', borderRadius: '50%',
                      width: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700, color: '#1A1A2E',
                    }}>✓</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 40px', borderTop: '1px solid rgba(201,168,76,0.08)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, color: '#444', fontSize: '0.75rem', flexShrink: 0,
      }}>
        <Sparkles size={11} color="#C9A84C" />
        Powered by AI | Ask our consultant for personalized recommendations
        <Sparkles size={11} color="#C9A84C" />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
