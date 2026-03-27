import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, Scissors, Star, Crown, ArrowRight } from 'lucide-react'

export default function Welcome() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(165deg, #0a0a1a 0%, #1A1A2E 35%, #16213E 65%, #0F3460 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Animated gold particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: [180, 120, 200, 90, 150, 100][i],
            height: [180, 120, 200, 90, 150, 100][i],
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(201,168,76,${[0.08, 0.05, 0.06, 0.04, 0.07, 0.03][i]}) 0%, transparent 70%)`,
            top: ['5%', '60%', '80%', '15%', '45%', '90%'][i],
            left: ['70%', '10%', '60%', '85%', '5%', '40%'][i],
            animation: `float ${[6, 8, 7, 9, 5, 10][i]}s ease-in-out infinite alternate`,
          }} />
        ))}
      </div>

      {/* Gold accent lines */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
      }} />

      {/* Main Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 10,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>

        {/* Logo Mark */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C 0%, #E8D5A3 50%, #A88B3D 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28, boxShadow: '0 0 60px rgba(201,168,76,0.3), 0 0 120px rgba(201,168,76,0.1)',
          animation: 'glow 3s ease-in-out infinite alternate',
        }}>
          <Scissors size={34} color="#1A1A2E" strokeWidth={2.5} />
        </div>

        {/* Brand Name */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.1,
          textAlign: 'center', marginBottom: 6, color: 'white',
          letterSpacing: '-0.5px',
        }}>
          S & See
        </h1>
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.35rem', fontWeight: 400, fontStyle: 'italic',
          background: 'linear-gradient(90deg, #C9A84C, #E8D5A3, #C9A84C)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8, letterSpacing: '3px',
        }}>
          SIGNATURE SALON
        </div>

        {/* Location tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 32,
        }}>
          <div style={{ width: 20, height: 1, background: 'rgba(201,168,76,0.4)' }} />
          <span style={{
            fontSize: '0.65rem', fontWeight: 600, color: 'rgba(201,168,76,0.6)',
            letterSpacing: '3px', textTransform: 'uppercase',
          }}>
            Avadi, Chennai
          </span>
          <div style={{ width: 20, height: 1, background: 'rgba(201,168,76,0.4)' }} />
        </div>

        {/* Tagline */}
        <p style={{
          color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem',
          maxWidth: 280, textAlign: 'center', lineHeight: 1.7,
          marginBottom: 40, fontWeight: 300,
        }}>
          Experience the future of beauty with our proprietary AI-driven consultation system.
        </p>

        {/* CTA Buttons */}
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            onClick={() => navigate('/register')}
            style={{
              width: '100%', padding: '18px 28px',
              background: 'linear-gradient(135deg, #C9A84C 0%, #A88B3D 100%)',
              border: 'none', borderRadius: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: "'Inter', sans-serif", fontSize: '1.05rem', fontWeight: 700,
              color: '#1A1A2E', letterSpacing: '0.5px',
              boxShadow: '0 8px 32px rgba(201,168,76,0.35), 0 2px 8px rgba(201,168,76,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(201,168,76,0.5)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(201,168,76,0.35), 0 2px 8px rgba(201,168,76,0.2)' }}
          >
            <Sparkles size={20} />
            Start AI Consultation
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%', padding: '15px 28px',
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(201,168,76,0.25)', borderRadius: 14, cursor: 'pointer',
              fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 500,
              color: 'rgba(201,168,76,0.7)', letterSpacing: '0.3px',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; e.currentTarget.style.color = '#C9A84C'; e.currentTarget.style.background = 'rgba(201,168,76,0.08)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.color = 'rgba(201,168,76,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
          >
            Manager Dashboard
          </button>
        </div>

        {/* Feature Pills */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { icon: <Star size={13} />, label: 'AI Precision' },
            { icon: <Crown size={13} />, label: 'Personalized' },
            { icon: <Sparkles size={13} />, label: 'Premium Care' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 24,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.12)',
            }}>
              <span style={{ color: '#C9A84C', display: 'flex' }}>{item.icon}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 600, color: 'rgba(201,168,76,0.6)',
                letterSpacing: '1px', textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Service Categories Preview */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 36,
        }}>
          {[
            { emoji: '\u2702\uFE0F', label: 'Hair' },
            { emoji: '\u2728', label: 'Skin' },
            { emoji: '\uD83E\uDDF4', label: 'Scalp' },
          ].map((cat, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
              }}>
                {cat.emoji}
              </div>
              <span style={{
                fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                letterSpacing: '1.5px', textTransform: 'uppercase',
              }}>
                {cat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{
        padding: '20px 24px', textAlign: 'center',
        borderTop: '1px solid rgba(201,168,76,0.08)',
        position: 'relative', zIndex: 10,
      }}>
        <p style={{
          fontSize: '0.6rem', fontWeight: 600, color: 'rgba(201,168,76,0.25)',
          letterSpacing: '2.5px', textTransform: 'uppercase',
        }}>
          Powered by Signature Intelligence v2.0
        </p>
        <p style={{
          fontSize: '0.55rem', fontWeight: 400, color: 'rgba(255,255,255,0.15)',
          marginTop: 4, letterSpacing: '0.5px',
        }}>
          Men &bull; Women &bull; Kids
        </p>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(15px, -20px) scale(1.1); }
        }
        @keyframes glow {
          0% { box-shadow: 0 0 40px rgba(201,168,76,0.2), 0 0 80px rgba(201,168,76,0.05); }
          100% { box-shadow: 0 0 60px rgba(201,168,76,0.4), 0 0 120px rgba(201,168,76,0.15); }
        }
      `}</style>
    </div>
  )
}
