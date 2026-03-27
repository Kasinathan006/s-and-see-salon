import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Sparkles, ArrowRight, Scissors, Crown } from 'lucide-react'
import { useClient } from '../context/ClientContext'

const categories = [
  {
    id: 'hair',
    icon: '\u2702\uFE0F',
    label: 'Hair',
    desc: 'Cut, Color, Style, Treatment',
    gradient: 'linear-gradient(135deg, #C9A84C 0%, #E8D5A3 100%)',
    tagline: 'Transform your look',
  },
  {
    id: 'skin',
    icon: '\u2728',
    label: 'Skin',
    desc: 'Facial, Glow, Anti-aging',
    gradient: 'linear-gradient(135deg, #E8D5A3 0%, #C9A84C 100%)',
    tagline: 'Reveal your radiance',
  },
  {
    id: 'scalp',
    icon: '\uD83E\uDDF4',
    label: 'Scalp',
    desc: 'Health, Dandruff, Growth',
    gradient: 'linear-gradient(135deg, #A88B3D 0%, #C9A84C 100%)',
    tagline: 'Nourish from the roots',
  }
]

export default function CategorySelect() {
  const navigate = useNavigate()
  const { client, setConsultation } = useClient()
  const [selected, setSelected] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  const handleContinue = () => {
    if (!selected) return
    setConsultation({ category: selected, startedAt: new Date().toISOString() })
    navigate('/consultation')
  }

  const firstName = client?.name?.split(' ')[0] || 'Guest'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg, #0a0a1a 0%, #1A1A2E 35%, #16213E 65%, #0F3460 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
          top: '10%', right: '-5%',
        }} />
        <div style={{
          position: 'absolute', width: 150, height: 150, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)',
          bottom: '15%', left: '-3%',
        }} />
      </div>

      {/* Header */}
      <div style={{
        padding: '24px 24px 20px',
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'relative', zIndex: 10,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C 0%, #E8D5A3 50%, #A88B3D 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(201,168,76,0.25)',
        }}>
          <Scissors size={22} color="#1A1A2E" strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.4rem', fontWeight: 700, color: 'white',
            margin: 0, lineHeight: 1.2,
          }}>
            Welcome, {firstName}
          </h1>
          <p style={{
            fontSize: '0.8rem', color: 'rgba(201,168,76,0.6)',
            margin: '3px 0 0', fontWeight: 400,
          }}>
            What brings you in today?
          </p>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: 20,
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}>
          <Crown size={16} color="#C9A84C" />
        </div>
      </div>

      {/* Divider */}
      <div style={{
        height: 1, margin: '0 24px',
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)',
      }} />

      {/* Main Content */}
      <div style={{
        padding: '28px 24px 32px',
        position: 'relative', zIndex: 10,
        maxWidth: 480, margin: '0 auto',
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
      }}>
        {/* Section Title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} color="#C9A84C" />
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, color: '#C9A84C',
              letterSpacing: '2.5px', textTransform: 'uppercase',
            }}>
              AI-Powered Analysis
            </span>
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.7rem', fontWeight: 700, color: 'white',
            margin: 0, lineHeight: 1.3,
          }}>
            Choose Your<br />
            <span style={{
              background: 'linear-gradient(90deg, #C9A84C, #E8D5A3)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Focus Area</span>
          </h2>
        </div>

        {/* Category Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
          {categories.map((cat, i) => {
            const isSelected = selected === cat.id
            return (
              <div
                key={cat.id}
                onClick={() => setSelected(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '18px 20px',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.05) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '2px solid rgba(201,168,76,0.5)'
                    : '2px solid rgba(255,255,255,0.06)',
                  borderRadius: 20,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: loaded ? 1 : 0,
                  transform: loaded ? 'translateX(0)' : 'translateX(-20px)',
                  transitionDelay: `${0.2 + i * 0.1}s`,
                }}
                onMouseOver={e => {
                  if (!isSelected) {
                    e.currentTarget.style.border = '2px solid rgba(201,168,76,0.25)'
                    e.currentTarget.style.background = 'rgba(201,168,76,0.04)'
                  }
                }}
                onMouseOut={e => {
                  if (!isSelected) {
                    e.currentTarget.style.border = '2px solid rgba(255,255,255,0.06)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  }
                }}
              >
                {/* Glow effect when selected */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(201,168,76,0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: isSelected ? cat.gradient : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', flexShrink: 0,
                  boxShadow: isSelected ? '0 4px 20px rgba(201,168,76,0.3)' : 'none',
                  transition: 'all 0.3s ease',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                }}>
                  {cat.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.05rem', fontWeight: 700,
                    color: isSelected ? 'white' : 'rgba(255,255,255,0.7)',
                    margin: 0, marginBottom: 2,
                    transition: 'color 0.3s',
                  }}>
                    {cat.label}
                  </h3>
                  <p style={{
                    fontSize: '0.7rem', fontWeight: 500,
                    color: isSelected ? 'rgba(201,168,76,0.8)' : 'rgba(255,255,255,0.3)',
                    margin: 0, letterSpacing: '0.8px', textTransform: 'uppercase',
                    transition: 'color 0.3s',
                  }}>
                    {cat.desc}
                  </p>
                  {isSelected && (
                    <p style={{
                      fontSize: '0.75rem', fontStyle: 'italic',
                      color: 'rgba(232,213,163,0.6)', margin: '6px 0 0',
                      fontFamily: "'Playfair Display', serif",
                    }}>
                      "{cat.tagline}"
                    </p>
                  )}
                </div>

                {/* Checkbox */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.12)',
                  background: isSelected ? 'linear-gradient(135deg, #C9A84C, #A88B3D)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.3s ease',
                  boxShadow: isSelected ? '0 2px 10px rgba(201,168,76,0.4)' : 'none',
                }}>
                  {isSelected && <CheckCircle2 size={16} color="#1A1A2E" strokeWidth={3} />}
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA Button */}
        <div style={{
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
        }}>
          <button
            disabled={!selected}
            onClick={handleContinue}
            style={{
              width: '100%', padding: '18px 28px',
              background: selected
                ? 'linear-gradient(135deg, #C9A84C 0%, #A88B3D 100%)'
                : 'rgba(201,168,76,0.15)',
              border: 'none', borderRadius: 16, cursor: selected ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: "'Inter', sans-serif", fontSize: '1.05rem', fontWeight: 700,
              color: selected ? '#1A1A2E' : 'rgba(201,168,76,0.4)',
              boxShadow: selected ? '0 8px 32px rgba(201,168,76,0.35)' : 'none',
              transition: 'all 0.3s ease',
              opacity: selected ? 1 : 0.6,
            }}
            onMouseOver={e => {
              if (selected) {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(201,168,76,0.5)'
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = selected ? '0 8px 32px rgba(201,168,76,0.35)' : 'none'
            }}
          >
            <Sparkles size={20} />
            Start AI Analysis
            <ArrowRight size={18} />
          </button>

          {/* Bottom tagline */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginTop: 20,
          }}>
            <div style={{ width: 16, height: 1, background: 'rgba(201,168,76,0.2)' }} />
            <span style={{
              fontSize: '0.6rem', fontWeight: 600, color: 'rgba(201,168,76,0.3)',
              letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              Specialized for: Men &bull; Women &bull; Kids
            </span>
            <div style={{ width: 16, height: 1, background: 'rgba(201,168,76,0.2)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
