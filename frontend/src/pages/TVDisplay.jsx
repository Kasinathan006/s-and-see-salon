import { useState, useEffect, useRef, useCallback } from 'react'
import { Scissors, Sparkles, Search, X, User, Camera, Tv } from 'lucide-react'

// ===== HAIR COLOR PRESETS (realistic hair colors applied via blend mode) =====
const HAIR_STYLES = [
  { title: 'Natural Black', desc: 'Deep jet black with rich shine', hairColor: '#1a1a2e', intensity: 0.85, badge: '🖤', color: '#333' },
  { title: 'Caramel Highlights', desc: 'Warm caramel sun-kissed tones', hairColor: '#b8860b', intensity: 0.7, badge: '🍯', color: '#C9A84C' },
  { title: 'Rose Gold', desc: 'Trendy warm rose metallic', hairColor: '#b76e79', intensity: 0.65, badge: '🌹', color: '#E8A0A0' },
  { title: 'Ash Silver', desc: 'Cool ash to icy silver tones', hairColor: '#a8a9ad', intensity: 0.75, badge: '🌙', color: '#A8B0C0' },
  { title: 'Deep Burgundy', desc: 'Rich bold wine-red luxury', hairColor: '#722f37', intensity: 0.7, badge: '🍷', color: '#8B1A2C' },
  { title: 'Copper Bronze', desc: 'Warm metallic copper depth', hairColor: '#b87333', intensity: 0.7, badge: '🥉', color: '#B05820' },
  { title: 'Honey Blonde', desc: 'Golden honey warm blonde', hairColor: '#c9922e', intensity: 0.65, badge: '🌻', color: '#D4A030' },
  { title: 'Chocolate Brown', desc: 'Rich warm chocolate depth', hairColor: '#3e2723', intensity: 0.8, badge: '🍫', color: '#5D4037' },
  { title: 'Auburn Red', desc: 'Natural warm reddish brown', hairColor: '#a0522d', intensity: 0.65, badge: '🍂', color: '#A0522D' },
  { title: 'Platinum Blonde', desc: 'Bold icy platinum look', hairColor: '#e5e4e2', intensity: 0.6, badge: '⚡', color: '#E0E0E0' },
]

// ===== SKIN TREATMENT PRESETS =====
const FACE_FILTERS = [
  { title: 'Glass Skin', desc: 'Dewy luminous radiance', skinColor: '#ffe8e0', intensity: 0.18, brightness: 1.08, badge: '🌟', color: '#80C0FF' },
  { title: 'Gold Glow', desc: 'Premium gold-infused glow', skinColor: '#ffd89b', intensity: 0.15, brightness: 1.06, badge: '✨', color: '#C9A84C' },
  { title: 'Natural Beauty', desc: 'Soft enhanced natural look', skinColor: '#ffe0d0', intensity: 0.1, brightness: 1.04, badge: '🌸', color: '#FFB8A0' },
  { title: 'Matte Finish', desc: 'Flawless matte complexion', skinColor: '#f0e0d0', intensity: 0.12, brightness: 0.97, badge: '💎', color: '#D4C8B8' },
  { title: 'Brightening', desc: 'Even tone skin brightening', skinColor: '#fff5ee', intensity: 0.2, brightness: 1.1, badge: '☀️', color: '#FFF5E0' },
  { title: 'Anti-Tan', desc: 'De-tan fresh clear look', skinColor: '#ffe4c9', intensity: 0.16, brightness: 1.07, badge: '🧴', color: '#FFD4A0' },
]

const FILTER_TABS = [
  { key: 'hairstyle', label: '💇 Hair Styles' },
  { key: 'facefilter', label: '🧖 Skin Treatments' },
]

// ===== HAIR REGION DETECTION & COLORING ENGINE =====
function applyHairColor(canvas, img, hairColor, intensity) {
  const ctx = canvas.getContext('2d')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height

  // Draw original image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // Get image data for hair detection
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Parse target hair color
  const hr = parseInt(hairColor.slice(1, 3), 16)
  const hg = parseInt(hairColor.slice(3, 5), 16)
  const hb = parseInt(hairColor.slice(5, 7), 16)

  // Hair detection: analyze each pixel
  // Hair is typically dark, saturated, and found in the upper portion of the image
  const h = canvas.height
  const w = canvas.width

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      // Calculate luminance and saturation
      const lum = (0.299 * r + 0.587 * g + 0.114 * b)
      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0

      // Hair detection heuristics:
      // 1. Position weight - hair is more likely in top 55% of image
      const posWeight = y < h * 0.15 ? 1.0 :
                        y < h * 0.3 ? 0.95 :
                        y < h * 0.45 ? 0.8 :
                        y < h * 0.55 ? 0.5 :
                        y < h * 0.65 ? 0.2 : 0.0

      if (posWeight === 0) continue

      // 2. Hair is typically dark (luminance < 120) but not too dark (> 15)
      //    Also catch medium-dark hair up to ~150
      const lumScore = lum < 15 ? 0 :       // too dark (likely pure black bg)
                       lum < 50 ? 0.9 :      // very dark hair
                       lum < 80 ? 1.0 :       // typical dark hair
                       lum < 110 ? 0.85 :     // medium dark hair
                       lum < 140 ? 0.5 :      // lighter hair
                       lum < 170 ? 0.2 : 0    // probably skin/background

      // 3. Avoid skin tones (skin has specific R>G>B pattern with warm hue)
      const isSkinLike = r > 120 && g > 80 && b > 60 &&
                         r > g && g > b &&
                         (r - g) < 80 && (g - b) < 80 &&
                         lum > 80 && lum < 220
      const skinPenalty = isSkinLike ? 0.15 : 1.0

      // 4. Avoid very uniform bright areas (walls, clothing)
      const isUniform = (maxC - minC) < 15 && lum > 150
      if (isUniform) continue

      // Combined hair probability
      const hairProb = posWeight * lumScore * skinPenalty

      if (hairProb > 0.25) {
        // Apply color using "color" blend logic
        // Preserve luminance, change hue/saturation
        const blend = hairProb * intensity

        // Color blend: mix the hair color while preserving luminance
        const targetR = hr * (lum / 128)
        const targetG = hg * (lum / 128)
        const targetB = hb * (lum / 128)

        data[idx] = Math.min(255, Math.round(r * (1 - blend) + targetR * blend))
        data[idx + 1] = Math.min(255, Math.round(g * (1 - blend) + targetG * blend))
        data[idx + 2] = Math.min(255, Math.round(b * (1 - blend) + targetB * blend))
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}

// ===== SKIN TREATMENT ENGINE =====
function applySkinTreatment(canvas, img, skinColor, intensity, brightness = 1.0) {
  const ctx = canvas.getContext('2d')
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  const sr = parseInt(skinColor.slice(1, 3), 16)
  const sg = parseInt(skinColor.slice(3, 5), 16)
  const sb = parseInt(skinColor.slice(5, 7), 16)

  const h = canvas.height
  const w = canvas.width

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const lum = (0.299 * r + 0.587 * g + 0.114 * b)

      // Skin detection heuristics
      // Skin tone: R > G > B, warm tones, medium luminance
      const isSkin = r > 80 && g > 50 && b > 30 &&
                     r > g && (r - g) > 5 && (r - g) < 100 &&
                     lum > 60 && lum < 230

      // Face region weight (center-ish of image, upper half)
      const cx = w / 2, cy = h * 0.4
      const dx = (x - cx) / (w * 0.35)
      const dy = (y - cy) / (h * 0.4)
      const dist = Math.sqrt(dx * dx + dy * dy)
      const faceWeight = dist < 1 ? (1 - dist * 0.5) : Math.max(0, 1.5 - dist)

      if (isSkin && faceWeight > 0.2) {
        const blend = Math.min(1, faceWeight * intensity * 1.5)

        // Soft light blend for skin
        let nr = r * brightness
        let ng = g * brightness
        let nb = b * brightness

        // Mix with treatment color
        nr = nr * (1 - blend * 0.5) + sr * blend * 0.5
        ng = ng * (1 - blend * 0.5) + sg * blend * 0.5
        nb = nb * (1 - blend * 0.5) + sb * blend * 0.5

        // Slight smoothing effect (average with neighbors for glow)
        data[idx] = Math.min(255, Math.round(nr))
        data[idx + 1] = Math.min(255, Math.round(ng))
        data[idx + 2] = Math.min(255, Math.round(nb))
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.92)
}


export default function TVDisplay() {
  const [activeFilter, setActiveFilter] = useState('hairstyle')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedStyle, setSelectedStyle] = useState(0)

  // Client photo state
  const [clientPhoto, setClientPhoto] = useState(null)
  const [clientName, setClientName] = useState(null)
  const [clientCategory, setClientCategory] = useState('hair')

  // Processed images cache
  const [processedImages, setProcessedImages] = useState({})
  const [processing, setProcessing] = useState(false)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
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
          setProcessedImages({}) // clear cache for new photo
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

  // Process all style images when photo or filter tab changes
  const processAllStyles = useCallback(async () => {
    if (!clientPhoto) return
    setProcessing(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const styles = activeFilter === 'hairstyle' ? HAIR_STYLES : FACE_FILTERS
      const results = {}

      styles.forEach((style, i) => {
        const key = `${activeFilter}_${i}`
        if (processedImages[key]) {
          results[key] = processedImages[key]
          return
        }
        try {
          if (activeFilter === 'hairstyle') {
            results[key] = applyHairColor(canvas, img, style.hairColor, style.intensity)
          } else {
            results[key] = applySkinTreatment(canvas, img, style.skinColor, style.intensity, style.brightness)
          }
        } catch (e) {
          console.error('Processing error:', e)
          results[key] = clientPhoto
        }
      })

      setProcessedImages(prev => ({ ...prev, ...results }))
      setProcessing(false)
    }
    img.src = clientPhoto
  }, [clientPhoto, activeFilter])

  useEffect(() => {
    processAllStyles()
  }, [processAllStyles])

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
  const currentProcessedKey = `${activeFilter}_${selectedStyle % styles.length}`

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
      <canvas ref={canvasRef} style={{ display: 'none' }} />

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

        {/* ===== LEFT: CLIENT PHOTO WITH APPLIED STYLE ===== */}
        {clientPhoto ? (
          <div style={{
            width: 400,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(201,168,76,0.2)',
            background: 'rgba(0,0,0,0.25)',
            padding: '20px 18px',
            gap: 12,
            overflowY: 'auto',
          }}>
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
                {activeFilter === 'hairstyle' ? 'Hair Color Preview' : 'Skin Treatment Preview'}
              </div>
            </div>

            {/* ===== BEFORE / AFTER COMPARISON ===== */}
            <div style={{ display: 'flex', gap: 8 }}>
              {/* Before */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#aaa', padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, zIndex: 2 }}>BEFORE</div>
                <img
                  src={clientPhoto}
                  alt="Original"
                  style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, border: '2px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              {/* After */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(201,168,76,0.8)', color: '#1A1A2E', padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, zIndex: 2 }}>AFTER</div>
                {processing ? (
                  <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: 12, border: '2px solid #C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                    <div className="camera-spinner" />
                  </div>
                ) : (
                  <img
                    src={processedImages[currentProcessedKey] || clientPhoto}
                    alt="Styled"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, border: '2px solid #C9A84C', boxShadow: `0 0 30px ${currentStyle.color}44` }}
                  />
                )}
              </div>
            </div>

            {/* Style label */}
            <div style={{ textAlign: 'center', padding: '6px 0' }}>
              <span style={{ fontSize: '1.4rem', marginRight: 6 }}>{currentStyle.badge}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display, serif' }}>{currentStyle.title}</span>
              <p style={{ fontSize: '0.72rem', color: '#888', margin: '4px 0 0' }}>{currentStyle.desc}</p>
            </div>

            {/* Client Info */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <User size={14} /> {clientName || 'Client'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#888', marginTop: 4 }}>
                {clientCategory === 'hair' || clientCategory === 'hairstyle' ? '💇 Hair Consultation' : clientCategory === 'skin' ? '🧖 Skin Consultation' : '🌿 Scalp Treatment'}
              </div>
            </div>

            {/* Style dots */}
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
              Take a photo on the<br />consultation tablet and<br />click <strong style={{ color: '#C9A84C' }}>"View on TV"</strong><br />to see live style previews here
            </p>
            <Tv size={20} color="rgba(201,168,76,0.3)" />
          </div>
        )}

        {/* ===== RIGHT: STYLE CARDS GRID ===== */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Sparkles size={16} color="#C9A84C" />
            <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
              {activeFilter === 'hairstyle' ? 'Hair Color Catalog' : 'Skin Treatment Catalog'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#555', marginLeft: 'auto' }}>
              {filteredStyles.length} styles
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
          }}>
            {filteredStyles.map((style, i) => {
              const realIdx = styles.indexOf(style)
              const isActive = realIdx === (selectedStyle % styles.length) && clientPhoto
              const processedKey = `${activeFilter}_${realIdx}`
              return (
                <div
                  key={style.title}
                  onClick={() => setSelectedStyle(realIdx)}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))'
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.1)'}`,
                    borderRadius: 14,
                    padding: '12px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 20px ${style.color}44` : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Processed photo preview */}
                  {clientPhoto ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2', borderRadius: 8, overflow: 'hidden', marginBottom: 10, border: `1.5px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.15)'}` }}>
                      <img
                        src={processedImages[processedKey] || clientPhoto}
                        alt={style.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.5s ease' }}
                      />
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
        Powered by AI | Hair &amp; Skin Analysis Engine
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
