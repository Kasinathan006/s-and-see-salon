import { useState, useEffect, useRef, useCallback } from 'react'
import { Scissors, Sparkles, Search, X, User, Camera, Tv, Loader } from 'lucide-react'
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'

// ===== HAIR COLOR PRESETS =====
const HAIR_STYLES = [
  { title: 'Natural Black', desc: 'Deep jet black with rich shine', hairColor: [20, 18, 30], intensity: 0.9, badge: '🖤', color: '#333' },
  { title: 'Caramel Highlights', desc: 'Warm caramel sun-kissed tones', hairColor: [185, 135, 50], intensity: 0.75, badge: '🍯', color: '#C9A84C' },
  { title: 'Rose Gold', desc: 'Trendy warm rose metallic', hairColor: [190, 110, 120], intensity: 0.7, badge: '🌹', color: '#E8A0A0' },
  { title: 'Ash Silver', desc: 'Cool ash to icy silver tones', hairColor: [175, 180, 190], intensity: 0.7, badge: '🌙', color: '#A8B0C0' },
  { title: 'Deep Burgundy', desc: 'Rich bold wine-red luxury', hairColor: [130, 30, 55], intensity: 0.75, badge: '🍷', color: '#8B1A2C' },
  { title: 'Copper Bronze', desc: 'Warm metallic copper depth', hairColor: [185, 100, 45], intensity: 0.7, badge: '🥉', color: '#B05820' },
  { title: 'Honey Blonde', desc: 'Golden honey warm blonde', hairColor: [210, 170, 60], intensity: 0.7, badge: '🌻', color: '#D4A030' },
  { title: 'Chocolate Brown', desc: 'Rich warm chocolate depth', hairColor: [75, 45, 35], intensity: 0.85, badge: '🍫', color: '#5D4037' },
  { title: 'Auburn Red', desc: 'Natural warm reddish brown', hairColor: [165, 82, 45], intensity: 0.7, badge: '🍂', color: '#A0522D' },
  { title: 'Platinum Blonde', desc: 'Bold icy platinum look', hairColor: [230, 225, 215], intensity: 0.65, badge: '⚡', color: '#E0E0E0' },
]

// ===== SKIN TREATMENT PRESETS =====
const FACE_FILTERS = [
  { title: 'Glass Skin', desc: 'Dewy luminous radiance', skinColor: [255, 235, 225], intensity: 0.22, brightness: 1.12, badge: '🌟', color: '#80C0FF' },
  { title: 'Gold Glow', desc: 'Premium gold-infused glow', skinColor: [255, 218, 155], intensity: 0.18, brightness: 1.08, badge: '✨', color: '#C9A84C' },
  { title: 'Natural Beauty', desc: 'Soft enhanced natural look', skinColor: [255, 225, 210], intensity: 0.14, brightness: 1.05, badge: '🌸', color: '#FFB8A0' },
  { title: 'Matte Finish', desc: 'Flawless matte complexion', skinColor: [240, 225, 210], intensity: 0.16, brightness: 0.97, badge: '💎', color: '#D4C8B8' },
  { title: 'Brightening', desc: 'Even tone skin brightening', skinColor: [255, 245, 238], intensity: 0.25, brightness: 1.14, badge: '☀️', color: '#FFF5E0' },
  { title: 'Anti-Tan', desc: 'De-tan fresh clear look', skinColor: [255, 230, 200], intensity: 0.2, brightness: 1.1, badge: '🧴', color: '#FFD4A0' },
]

const FILTER_TABS = [
  { key: 'hairstyle', label: '💇 Hair Styles' },
  { key: 'facefilter', label: '🧖 Skin Treatments' },
]

// Segmentation categories from MediaPipe multiclass model
// 0=Background, 1=Hair, 2=Body-skin, 3=Face-skin, 4=Clothes, 5=Others
const CATEGORY_HAIR = 1
const CATEGORY_FACE_SKIN = 3


export default function TVDisplay() {
  const [activeFilter, setActiveFilter] = useState('hairstyle')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedStyle, setSelectedStyle] = useState(0)

  const [clientPhoto, setClientPhoto] = useState(null)
  const [clientName, setClientName] = useState(null)
  const [clientCategory, setClientCategory] = useState('hair')

  const [segmentationMask, setSegmentationMask] = useState(null)
  const [maskDimensions, setMaskDimensions] = useState(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [processedImages, setProcessedImages] = useState({})
  const [processing, setProcessing] = useState(false)

  const segmenterRef = useRef(null)
  const searchRef = useRef(null)

  // ===== LOAD MEDIAPIPE SEGMENTATION MODEL =====
  useEffect(() => {
    let cancelled = false
    const loadModel = async () => {
      setModelLoading(true)
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        if (cancelled) return
        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
            delegate: 'GPU',
          },
          outputCategoryMask: true,
          outputConfidenceMasks: false,
          runningMode: 'IMAGE',
        })
        if (cancelled) return
        segmenterRef.current = segmenter
        setModelReady(true)
        console.log('MediaPipe Hair Segmentation model loaded!')
      } catch (err) {
        console.error('Model load error:', err)
        // Try without GPU delegate
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
          )
          if (cancelled) return
          const segmenter = await ImageSegmenter.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
            },
            outputCategoryMask: true,
            outputConfidenceMasks: false,
            runningMode: 'IMAGE',
          })
          if (cancelled) return
          segmenterRef.current = segmenter
          setModelReady(true)
          console.log('MediaPipe loaded (CPU fallback)')
        } catch (err2) {
          console.error('Model load failed completely:', err2)
        }
      }
      setModelLoading(false)
    }
    loadModel()
    return () => { cancelled = true }
  }, [])

  // ===== POLL LOCALSTORAGE FOR PHOTO =====
  useEffect(() => {
    const loadClientData = () => {
      try {
        const photo = localStorage.getItem('salon_tv_photo')
        const name = localStorage.getItem('salon_tv_client_name')
        const cat = localStorage.getItem('salon_tv_category')
        if (photo && photo !== clientPhoto) {
          setClientPhoto(photo)
          setSegmentationMask(null)
          setProcessedImages({})
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

  // ===== RUN SEGMENTATION WHEN PHOTO + MODEL READY =====
  useEffect(() => {
    if (!clientPhoto || !modelReady || !segmenterRef.current) return
    if (segmentationMask) return // already segmented

    const runSegmentation = async () => {
      setProcessing(true)
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          // Create a canvas to draw the image for segmentation
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          try {
            const result = segmenterRef.current.segment(canvas)
            if (result && result.categoryMask) {
              const maskData = result.categoryMask.getAsUint8Array()
              // Store mask as regular array (MediaPipe mask may get disposed)
              const maskCopy = new Uint8Array(maskData.length)
              maskCopy.set(maskData)
              setSegmentationMask(maskCopy)
              setMaskDimensions({ width: result.categoryMask.width, height: result.categoryMask.height })
              console.log(`Segmentation done! Mask: ${result.categoryMask.width}x${result.categoryMask.height}`)
              result.close()
            }
          } catch (segErr) {
            console.error('Segmentation error:', segErr)
          }
          setProcessing(false)
        }
        img.onerror = () => setProcessing(false)
        img.src = clientPhoto
      } catch (e) {
        console.error('Segmentation setup error:', e)
        setProcessing(false)
      }
    }
    runSegmentation()
  }, [clientPhoto, modelReady, segmentationMask])

  // ===== PROCESS STYLE IMAGES USING SEGMENTATION MASK =====
  const processStyles = useCallback(() => {
    if (!clientPhoto || !segmentationMask || !maskDimensions) return
    setProcessing(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const imgW = img.naturalWidth || img.width
      const imgH = img.naturalHeight || img.height
      canvas.width = imgW
      canvas.height = imgH

      const styles = activeFilter === 'hairstyle' ? HAIR_STYLES : FACE_FILTERS
      const targetCategory = activeFilter === 'hairstyle' ? CATEGORY_HAIR : CATEGORY_FACE_SKIN
      const results = {}

      styles.forEach((style, i) => {
        const key = `${activeFilter}_${i}`
        if (processedImages[key]) {
          results[key] = processedImages[key]
          return
        }

        // Draw original image
        ctx.drawImage(img, 0, 0, imgW, imgH)
        const imageData = ctx.getImageData(0, 0, imgW, imgH)
        const pixels = imageData.data

        const maskW = maskDimensions.width
        const maskH = maskDimensions.height

        // Scale factors from mask to image
        const scaleX = maskW / imgW
        const scaleY = maskH / imgH

        if (activeFilter === 'hairstyle') {
          const [hr, hg, hb] = style.hairColor
          const intensity = style.intensity

          for (let y = 0; y < imgH; y++) {
            for (let x = 0; x < imgW; x++) {
              // Map image pixel to mask pixel
              const mx = Math.min(Math.floor(x * scaleX), maskW - 1)
              const my = Math.min(Math.floor(y * scaleY), maskH - 1)
              const maskIdx = my * maskW + mx
              const category = segmentationMask[maskIdx]

              if (category === targetCategory) {
                const idx = (y * imgW + x) * 4
                const r = pixels[idx]
                const g = pixels[idx + 1]
                const b = pixels[idx + 2]

                // Preserve luminance, apply new color
                const lum = 0.299 * r + 0.587 * g + 0.114 * b
                const lumFactor = lum / 128

                const targetR = Math.min(255, hr * lumFactor)
                const targetG = Math.min(255, hg * lumFactor)
                const targetB = Math.min(255, hb * lumFactor)

                pixels[idx] = Math.round(r * (1 - intensity) + targetR * intensity)
                pixels[idx + 1] = Math.round(g * (1 - intensity) + targetG * intensity)
                pixels[idx + 2] = Math.round(b * (1 - intensity) + targetB * intensity)
              }
            }
          }
        } else {
          // Skin treatment
          const [sr, sg, sb] = style.skinColor
          const intensity = style.intensity
          const brightness = style.brightness || 1.0

          for (let y = 0; y < imgH; y++) {
            for (let x = 0; x < imgW; x++) {
              const mx = Math.min(Math.floor(x * scaleX), maskW - 1)
              const my = Math.min(Math.floor(y * scaleY), maskH - 1)
              const maskIdx = my * maskW + mx
              const category = segmentationMask[maskIdx]

              if (category === targetCategory) {
                const idx = (y * imgW + x) * 4
                let r = pixels[idx] * brightness
                let g = pixels[idx + 1] * brightness
                let b = pixels[idx + 2] * brightness

                // Soft light blend with treatment color
                r = r * (1 - intensity) + sr * intensity
                g = g * (1 - intensity) + sg * intensity
                b = b * (1 - intensity) + sb * intensity

                pixels[idx] = Math.min(255, Math.round(r))
                pixels[idx + 1] = Math.min(255, Math.round(g))
                pixels[idx + 2] = Math.min(255, Math.round(b))
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0)
        results[key] = canvas.toDataURL('image/jpeg', 0.9)
      })

      setProcessedImages(prev => ({ ...prev, ...results }))
      setProcessing(false)
    }
    img.src = clientPhoto
  }, [clientPhoto, segmentationMask, maskDimensions, activeFilter])

  useEffect(() => {
    processStyles()
  }, [processStyles])

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto cycle styles
  useEffect(() => {
    if (!clientPhoto || !segmentationMask) return
    const styles = activeFilter === 'hairstyle' ? HAIR_STYLES : FACE_FILTERS
    const t = setInterval(() => setSelectedStyle(p => (p + 1) % styles.length), 4000)
    return () => clearInterval(t)
  }, [clientPhoto, segmentationMask, activeFilter])

  const styles = activeFilter === 'hairstyle' ? HAIR_STYLES : FACE_FILTERS
  const filteredStyles = searchQuery
    ? styles.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    : styles
  const currentStyle = styles[selectedStyle % styles.length]
  const currentProcessedKey = `${activeFilter}_${selectedStyle % styles.length}`

  const isLoading = modelLoading || (processing && !Object.keys(processedImages).length)

  return (
    <div style={{
      minHeight: '100vh', maxHeight: '100vh',
      background: 'linear-gradient(135deg, #07070f 0%, #1A1A2E 40%, #0F3460 100%)',
      color: 'white', display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif', overflow: 'hidden',
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20,
        padding: '16px 40px',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', flexShrink: 0,
      }}>
        <div style={{
          width: 52, height: 52,
          background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 24px rgba(201,168,76,0.5)', flexShrink: 0,
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
                padding: '8px 18px', borderRadius: 20,
                border: `2px solid ${activeFilter === tab.key ? '#C9A84C' : 'rgba(255,255,255,0.15)'}`,
                background: activeFilter === tab.key ? 'linear-gradient(135deg, #C9A84C, #A88B3D)' : 'rgba(255,255,255,0.05)',
                color: activeFilter === tab.key ? '#1A1A2E' : 'white',
                fontSize: '0.82rem', fontWeight: activeFilter === tab.key ? 700 : 500,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                boxShadow: activeFilter === tab.key ? '0 4px 15px rgba(201,168,76,0.3)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Model status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: modelReady ? '#4CAF50' : modelLoading ? '#FFC107' : '#F44336',
            boxShadow: modelReady ? '0 0 8px #4CAF50' : 'none',
          }} />
          <span style={{ fontSize: '0.65rem', color: '#666' }}>
            {modelReady ? 'AI Ready' : modelLoading ? 'Loading AI...' : 'AI Offline'}
          </span>
        </div>

        <div style={{ position: 'relative', width: 260, marginLeft: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C9A84C' }} />
          <input
            ref={searchRef}
            type="text" placeholder="Search styles..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
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

      {/* MAIN BODY */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: CLIENT PHOTO PANEL */}
        {clientPhoto ? (
          <div style={{
            width: 400, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid rgba(201,168,76,0.2)',
            background: 'rgba(0,0,0,0.25)', padding: '20px 18px', gap: 12, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)',
                borderRadius: 20, padding: '5px 14px',
                fontSize: '0.7rem', color: '#C9A84C', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: segmentationMask ? '#4CAF50' : '#FFC107', animation: 'pulse 1.5s infinite' }} />
                {segmentationMask ? (activeFilter === 'hairstyle' ? 'AI Hair Color Preview' : 'AI Skin Treatment Preview') : 'Analyzing...'}
              </div>
            </div>

            {/* BEFORE / AFTER */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', color: '#aaa', padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, zIndex: 2 }}>BEFORE</div>
                <img src={clientPhoto} alt="Original" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, border: '2px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(201,168,76,0.8)', color: '#1A1A2E', padding: '2px 8px', borderRadius: 8, fontSize: '0.6rem', fontWeight: 700, zIndex: 2 }}>AFTER</div>
                {isLoading ? (
                  <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: 12, border: '2px solid #C9A84C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', gap: 8 }}>
                    <Loader size={24} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.7rem', color: '#C9A84C' }}>{modelLoading ? 'Loading AI Model...' : 'Processing...'}</span>
                  </div>
                ) : (
                  <img
                    src={processedImages[currentProcessedKey] || clientPhoto}
                    alt="Styled"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, border: '2px solid #C9A84C', boxShadow: `0 0 30px ${currentStyle.color}44`, transition: 'all 0.3s ease' }}
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {styles.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedStyle(i)}
                  style={{
                    width: selectedStyle % styles.length === i ? 20 : 8,
                    height: 8, borderRadius: 4,
                    background: selectedStyle % styles.length === i ? '#C9A84C' : 'rgba(255,255,255,0.2)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
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
            background: 'rgba(0,0,0,0.2)', padding: 28, gap: 16, textAlign: 'center',
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

        {/* RIGHT: STYLE CARDS GRID */}
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
                    borderRadius: 14, padding: '12px 12px', cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? `0 0 20px ${style.color}44` : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {clientPhoto && processedImages[processedKey] ? (
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2', borderRadius: 8, overflow: 'hidden', marginBottom: 10, border: `1.5px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.15)'}` }}>
                      <img src={processedImages[processedKey]} alt={style.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : clientPhoto ? (
                    <div style={{ width: '100%', aspectRatio: '3/2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, background: 'rgba(0,0,0,0.2)', border: `1.5px solid rgba(201,168,76,0.15)` }}>
                      <Loader size={16} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
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
                  <p style={{ fontSize: '0.68rem', color: '#777', margin: 0, lineHeight: 1.5 }}>{style.desc}</p>

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
        Powered by MediaPipe AI | Real-Time Hair &amp; Skin Segmentation
        <Sparkles size={11} color="#C9A84C" />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
