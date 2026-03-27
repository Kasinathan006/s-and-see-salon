import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Sparkles, Search, X, User, Camera, Tv, Loader, Brain, Target, Video } from 'lucide-react'
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'
import { salonAI } from '../utils/aiAnalyzer'
import { prepareHairBase, applyStyleToBase } from '../utils/hairInpaint'

const CATEGORY_HAIR = 1

// ===== FACE LANDMARK TO FACE DATA CONVERTER =====
function getFaceDataFromLandmarks(landmarks, imgWidth, imgHeight) {
  if (!landmarks || landmarks.length === 0) return null
  
  // MediaPipe face landmark indices
  const TOP_HEAD = 10
  const CHIN = 152
  const LEFT_CHEEK = 234
  const RIGHT_CHEEK = 454
  const LEFT_EYE = 33
  const RIGHT_EYE = 263
  const NOSE_TIP = 1
  
  const getPoint = (idx) => ({
    x: landmarks[idx].x * imgWidth,
    y: landmarks[idx].y * imgHeight
  })
  
  const top = getPoint(TOP_HEAD)
  const chin = getPoint(CHIN)
  const leftCheek = getPoint(LEFT_CHEEK)
  const rightCheek = getPoint(RIGHT_CHEEK)
  const leftEye = getPoint(LEFT_EYE)
  const rightEye = getPoint(RIGHT_EYE)
  const nose = getPoint(NOSE_TIP)
  
  const centerX = (leftCheek.x + rightCheek.x) / 2
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x)
  const faceHeight = Math.abs(chin.y - top.y)
  
  return {
    centerX,
    topY: top.y,
    chinY: chin.y,
    sideY: (leftCheek.y + rightCheek.y) / 2,
    eyeY: (leftEye.y + rightEye.y) / 2,
    width: faceWidth,
    height: faceHeight,
    noseX: nose.x,
    noseY: nose.y
  }
}

// ===== HAIRSTYLE OVERLAY RENDERER =====
function renderHairstyleOverlay(baseImage, faceData, styleKey, originalHairColor) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const w = baseImage.naturalWidth || baseImage.width
  const h = baseImage.naturalHeight || baseImage.height
  canvas.width = w
  canvas.height = h
  
  // Draw original photo
  ctx.drawImage(baseImage, 0, 0, w, h)
  
  if (!faceData) return canvas.toDataURL('image/jpeg', 0.92)
  
  const template = HAIRSTYLE_TEMPLATES[styleKey]
  if (!template) return canvas.toDataURL('image/jpeg', 0.92)
  
  // Create overlay canvas for hairstyle
  const overlayCanvas = document.createElement('canvas')
  overlayCanvas.width = w
  overlayCanvas.height = h
  const octx = overlayCanvas.getContext('2d')
  
  // Draw the hairstyle template
  template.draw(octx, faceData)
  
  // Composite the overlay onto the original with blending
  ctx.globalCompositeOperation = 'source-over'
  
  // Add shadow under hair for realism
  ctx.save()
  ctx.globalAlpha = 0.3
  ctx.filter = 'blur(8px)'
  ctx.drawImage(overlayCanvas, 4, 8, w, h)
  ctx.restore()
  
  // Draw actual hair
  ctx.globalAlpha = 0.92
  ctx.drawImage(overlayCanvas, 0, 0, w, h)
  
  // Blend edges using feathering
  ctx.globalCompositeOperation = 'destination-over'
  
  return canvas.toDataURL('image/jpeg', 0.92)
}
function erodeMask(mask, w, h, radius) {
  const result = new Uint8Array(mask)
  const r2 = radius * radius
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] !== CATEGORY_HAIR) continue
      let shouldErode = false
      for (let dy = -radius; dy <= radius && !shouldErode; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > r2) continue
          const ny = y + dy, nx = x + dx
          if (ny < 0 || ny >= h || nx < 0 || nx >= w || mask[ny * w + nx] !== CATEGORY_HAIR) {
            shouldErode = true; break
          }
        }
      }
      if (shouldErode) result[y * w + x] = 0
    }
  }
  return result
}

function dilateMask(mask, w, h, radius) {
  const result = new Uint8Array(mask)
  const r2 = radius * radius
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === CATEGORY_HAIR) continue
      let shouldDilate = false
      for (let dy = -radius; dy <= radius && !shouldDilate; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > r2) continue
          const ny = y + dy, nx = x + dx
          if (ny >= 0 && ny < h && nx >= 0 && nx < w && mask[ny * w + nx] === CATEGORY_HAIR) {
            shouldDilate = true; break
          }
        }
      }
      if (shouldDilate) result[y * w + x] = CATEGORY_HAIR
    }
  }
  return result
}

function fadeSidesMask(mask, w, h, fadeRatio) {
  let minX = w, maxX = 0, minY = h, maxY = 0, sumX = 0, count = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] === CATEGORY_HAIR) {
        if (x < minX) minX = x; if (x > maxX) maxX = x
        if (y < minY) minY = y; if (y > maxY) maxY = y
        sumX += x; count++
      }
    }
  }
  if (count === 0) return new Uint8Array(mask)
  const centerX = sumX / count
  const hairH = Math.max(maxY - minY, 1)
  const hairW = Math.max((maxX - minX) / 2, 1)
  const result = new Uint8Array(mask)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (mask[y * w + x] !== CATEGORY_HAIR) continue
      const relY = (y - minY) / hairH
      const relX = Math.abs(x - centerX) / hairW
      let keep = 1.0
      if (relY > (1 - fadeRatio)) keep *= (1 - relY) / Math.max(fadeRatio, 0.01)
      const sideInfluence = Math.max(0, relY - 0.2) / 0.8
      keep -= relX * sideInfluence * fadeRatio * 1.6
      if (keep < 0.35) result[y * w + x] = 0
    }
  }
  return result
}

// ===== WORLD HAIRSTYLES — Shape only, NO color =====
const HAIRSTYLES = [
  // --- BUZZ & ULTRA SHORT ---
  { title: 'Induction Cut', desc: 'Shortest clipper guard, military zero', badge: '🪒', tag: 'buzz', erode: 8 },
  { title: 'Buzz Cut', desc: 'Classic all-over short buzz', badge: '💈', tag: 'buzz', erode: 6 },
  { title: 'Butch Cut', desc: 'Slightly longer uniform buzz', badge: '🔲', tag: 'buzz', erode: 5 },
  { title: 'Burr Cut', desc: 'Very close cropped all over', badge: '⬛', tag: 'buzz', erode: 7 },

  // --- SHORT CUTS ---
  { title: 'Crew Cut', desc: 'American classic tapered short', badge: '🇺🇸', tag: 'short', erode: 4 },
  { title: 'Ivy League', desc: 'Preppy longer crew cut', badge: '🎓', tag: 'short', erode: 3 },
  { title: 'Caesar Cut', desc: 'Roman-inspired short fringe', badge: '🏛️', tag: 'short', erode: 4, fade: 0.15 },
  { title: 'French Crop', desc: 'European textured short crop', badge: '🇫🇷', tag: 'short', erode: 3, fade: 0.12 },
  { title: 'Edgar Cut', desc: 'Sharp straight fringe line', badge: '📏', tag: 'short', erode: 3, fade: 0.2 },
  { title: 'Regulation Cut', desc: 'Military regulation standard', badge: '🪖', tag: 'short', erode: 4, fade: 0.18 },

  // --- FADE STYLES ---
  { title: 'Skin Fade', desc: 'Bald fade to skin on sides', badge: '🔥', tag: 'fade', fade: 0.58 },
  { title: 'High Fade', desc: 'Fade starts high on temple', badge: '📐', tag: 'fade', fade: 0.52 },
  { title: 'Mid Fade', desc: 'Clean fade at mid level', badge: '⚖️', tag: 'fade', fade: 0.42 },
  { title: 'Low Fade', desc: 'Subtle taper at lower sides', badge: '📉', tag: 'fade', fade: 0.28 },
  { title: 'Taper Fade', desc: 'Gradual classic taper', badge: '📊', tag: 'fade', fade: 0.32 },
  { title: 'Drop Fade', desc: 'Drops behind the ear arc', badge: '💧', tag: 'fade', fade: 0.48 },
  { title: 'Burst Fade', desc: 'Radiates around the ear', badge: '💥', tag: 'fade', fade: 0.55 },
  { title: 'Temple Fade', desc: 'Cleans up just the temples', badge: '🎯', tag: 'fade', fade: 0.2 },
  { title: 'Shadow Fade', desc: 'Very gradual subtle blend', badge: '🌑', tag: 'fade', fade: 0.25 },
  { title: 'Bald Fade', desc: 'Fades completely to skin', badge: '✨', tag: 'fade', fade: 0.62 },

  // --- VOLUME & LONG STYLES ---
  { title: 'Pompadour', desc: 'Elvis-style swept-up volume', badge: '👑', tag: 'volume', dilate: 5 },
  { title: 'Quiff', desc: 'British swept-up front volume', badge: '🇬🇧', tag: 'volume', dilate: 4 },
  { title: 'Blowout', desc: 'Italian styled voluminous blow dry', badge: '🇮🇹', tag: 'volume', dilate: 6 },
  { title: 'Afro', desc: 'Natural full rounded afro', badge: '✊', tag: 'volume', dilate: 8 },
  { title: 'Fluffy Hair', desc: 'Korean soft fluffy volume', badge: '🇰🇷', tag: 'volume', dilate: 4 },
  { title: 'Curtain Bangs', desc: 'Middle part with volume', badge: '🎭', tag: 'volume', dilate: 3 },
  { title: 'Shag Cut', desc: '70s layered shaggy texture', badge: '🎸', tag: 'volume', dilate: 5 },
  { title: 'Wolf Cut', desc: 'Trendy messy layered volume', badge: '🐺', tag: 'volume', dilate: 6 },
  { title: 'Mullet', desc: 'Business front, party back', badge: '🤘', tag: 'volume', dilate: 5, fade: 0.15 },
  { title: 'Jewfro', desc: 'Curly natural volume style', badge: '🌀', tag: 'volume', dilate: 7 },
  { title: 'Mop Top', desc: 'Beatles-inspired full length', badge: '🎵', tag: 'volume', dilate: 4 },
  { title: 'Surfer Hair', desc: 'Beach-style natural flow', badge: '🏄', tag: 'volume', dilate: 3 },
  { title: 'K-Pop Volume', desc: 'Korean idol voluminous style', badge: '🎤', tag: 'volume', dilate: 5 },
  { title: 'Natural Boost', desc: 'Your natural hair + body', badge: '💫', tag: 'volume', dilate: 3 },
  { title: 'Big Hair', desc: 'Maximum oversized volume', badge: '🦁', tag: 'volume', dilate: 9 },

  // --- FADE + CUT COMBOS ---
  { title: 'Fade + Buzz Top', desc: 'Faded sides with buzz on top', badge: '⚡', tag: 'combo', erode: 2, fade: 0.45 },
  { title: 'Military Fade', desc: 'Strict military with fade', badge: '🎖️', tag: 'combo', erode: 3, fade: 0.5 },
  { title: 'Executive Cut', desc: 'Boardroom-ready trim with taper', badge: '👔', tag: 'combo', erode: 1, fade: 0.22 },
  { title: 'Gentleman Taper', desc: 'Classic tapered short sides', badge: '🎩', tag: 'combo', erode: 2, fade: 0.3 },

  // --- FADE + VOLUME COMBOS ---
  { title: 'Pompadour Fade', desc: 'Volume on top + faded sides', badge: '🌟', tag: 'combo', dilate: 3, fade: 0.4 },
  { title: 'Quiff Fade', desc: 'Front volume + clean fade', badge: '💎', tag: 'combo', dilate: 2, fade: 0.35 },
  { title: 'Mohawk Fade', desc: 'Central strip volume + skin sides', badge: '🦅', tag: 'combo', dilate: 3, fade: 0.58 },
  { title: 'Faux Hawk Fade', desc: 'Softer mohawk with fade', badge: '🦊', tag: 'combo', dilate: 2, fade: 0.48 },
  { title: 'Undercut', desc: 'Volume on top, short sides', badge: '🔪', tag: 'combo', dilate: 2, fade: 0.52 },
  { title: 'Disconnected Cut', desc: 'Dramatic top-side contrast', badge: '⚔️', tag: 'combo', dilate: 4, fade: 0.55 },
  { title: 'Textured Top Fade', desc: 'Textured top with mid fade', badge: '🌊', tag: 'combo', dilate: 2, fade: 0.38 },
  { title: 'Modern Mullet Fade', desc: 'Updated mullet with fade', badge: '🎶', tag: 'combo', dilate: 4, fade: 0.3 },
]

const TAG_LABELS = {
  buzz: { label: 'Buzz', color: '#FF5722' },
  short: { label: 'Short', color: '#FF9800' },
  fade: { label: 'Fade', color: '#2196F3' },
  volume: { label: 'Volume', color: '#4CAF50' },
  combo: { label: 'Combo', color: '#9C27B0' },
}

export default function TVDisplay() {
  const navigate = useNavigate()
  const [selectedStyle, setSelectedStyle] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTag, setFilterTag] = useState(null)

  const [clientPhoto, setClientPhoto] = useState(null)
  const [clientName, setClientName] = useState(null)

  const [segmentationMask, setSegmentationMask] = useState(null)
  const [maskDimensions, setMaskDimensions] = useState(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const [processedImages, setProcessedImages] = useState({})
  const [processing, setProcessing] = useState(false)
  const [hairPixelCount, setHairPixelCount] = useState(0)
  const [scalpPixelCount, setScalpPixelCount] = useState(0)

  // ===== ADVANCED AI ANALYSIS STATE =====
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [faceShape, setFaceShape] = useState(null)
  const [hairType, setHairType] = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [analysisConfidence, setAnalysisConfidence] = useState(0)

  const segmenterRef = useRef(null)
  const clientPhotoRef = useRef(null)
  const searchRef = useRef(null)

  // Filter styles
  const filteredStyles = HAIRSTYLES.filter(s => {
    if (filterTag && s.tag !== filterTag) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.tag.includes(q)
    }
    return true
  })

  // ===== LOAD MEDIAPIPE =====
  useEffect(() => {
    let cancelled = false
    const loadModel = async () => {
      setModelLoading(true)
      const loadWith = async (delegate) => {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        if (cancelled) return null
        return ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
            ...(delegate ? { delegate } : {}),
          },
          outputCategoryMask: true, outputConfidenceMasks: false, runningMode: 'IMAGE',
        })
      }
      try {
        const seg = await loadWith('GPU')
        if (!cancelled && seg) { segmenterRef.current = seg; setModelReady(true) }
      } catch {
        try {
          const seg = await loadWith(null)
          if (!cancelled && seg) { segmenterRef.current = seg; setModelReady(true) }
        } catch (e) { console.error('Model failed:', e) }
      }
      setModelLoading(false)
    }
    loadModel()
    return () => { cancelled = true }
  }, [])

  // ===== POLL LOCALSTORAGE =====
  useEffect(() => {
    const load = () => {
      try {
        const photo = localStorage.getItem('salon_tv_photo')
        const name = localStorage.getItem('salon_tv_client_name')
        if (photo && photo !== clientPhotoRef.current) {
          clientPhotoRef.current = photo
          setClientPhoto(photo)
          setSegmentationMask(null)
          setProcessedImages({})
        }
        if (name) setClientName(name)
      } catch { /* ignore */ }
    }
    load()
    const poller = setInterval(load, 2000)
    return () => clearInterval(poller)
  }, [])

  // ===== RUN SEGMENTATION & ADVANCED AI ANALYSIS =====
  useEffect(() => {
    if (!clientPhoto || !modelReady || !segmenterRef.current || segmentationMask) return
    setProcessing(true)
    setAiLoading(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

      // Run both analyses in parallel
      await Promise.all([
        // Basic segmentation
        (async () => {
          try {
            const result = segmenterRef.current.segment(canvas)
            if (result?.categoryMask) {
              const maskData = result.categoryMask.getAsUint8Array()
              const maskCopy = new Uint8Array(maskData.length)
              maskCopy.set(maskData)
              const mw = result.categoryMask.width, mh = result.categoryMask.height
              let hair = 0, face = 0, body = 0
              for (let i = 0; i < maskCopy.length; i++) {
                if (maskCopy[i] === 1) hair++
                else if (maskCopy[i] === 2) body++
                else if (maskCopy[i] === 3) face++
              }
              setHairPixelCount(hair)
              setScalpPixelCount(face + body)
              setMaskDimensions({ width: mw, height: mh })
              setSegmentationMask(maskCopy)
              result.close()
            }
          } catch (e) { console.error('Segmentation error:', e) }
        })(),

        // Advanced AI analysis with TensorFlow.js
        (async () => {
          try {
            await salonAI.initialize()
            const analysis = await salonAI.analyzeImage(img)
            setAiAnalysis(analysis)
            setFaceShape(analysis.faceShape)
            setHairType(analysis.hairAnalysis)
            setAiRecommendations(analysis.recommendations)
            setAnalysisConfidence(analysis.confidence)
            console.log('✅ AI Analysis Complete:', {
              faceShape: analysis.faceShape,
              confidence: analysis.confidence,
              hairType: analysis.hairAnalysis?.estimatedHairType
            })
          } catch (e) {
            console.error('AI analysis error:', e)
          } finally {
            setAiLoading(false)
          }
        })()
      ])

      setProcessing(false)
    }
    img.onerror = () => {
      setProcessing(false)
      setAiLoading(false)
    }
    img.src = clientPhoto
  }, [clientPhoto, modelReady, segmentationMask])

  // ===== PROCESS HAIRSTYLES: remove real hair → draw new style on clean scalp =====
  const processStyles = useCallback(() => {
    if (!clientPhoto || !segmentationMask || !maskDimensions) return
    setProcessing(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const imgW = img.naturalWidth || img.width
      const imgH = img.naturalHeight || img.height

      // Prepare original photo + mask metadata ONCE (shared across all 47 styles)
      const prepared = prepareHairBase(img, segmentationMask, maskDimensions.width, maskDimensions.height)

      const results = {}
      HAIRSTYLES.forEach((style, i) => {
        const key = `style_${i}`
        if (processedImages[key]) { results[key] = processedImages[key]; return }
        results[key] = applyStyleToBase(prepared, style)
      })
      setProcessedImages(prev => ({ ...prev, ...results }))
      setProcessing(false)
    }
    img.onerror = () => setProcessing(false)
    img.src = clientPhoto
  }, [clientPhoto, segmentationMask, maskDimensions, processedImages])

  useEffect(() => { processStyles() }, [processStyles])


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!clientPhoto || !segmentationMask) return
    const t = setInterval(() => setSelectedStyle(p => (p + 1) % HAIRSTYLES.length), 4500)
    return () => clearInterval(t)
  }, [clientPhoto, segmentationMask])

  const currentStyle = HAIRSTYLES[selectedStyle % HAIRSTYLES.length]
  const currentKey = `style_${selectedStyle % HAIRSTYLES.length}`
  const isLoading = modelLoading || (processing && !Object.keys(processedImages).length)
  const totalMask = maskDimensions ? maskDimensions.width * maskDimensions.height : 1
  const scanCoverage = Math.round(((hairPixelCount + scalpPixelCount) / totalMask) * 100)

  return (
    <div style={{
      minHeight: '100vh', maxHeight: '100vh',
      background: 'linear-gradient(135deg, #07070f 0%, #1A1A2E 40%, #0F3460 100%)',
      color: 'white', display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif', overflow: 'hidden',
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 28px',
        borderBottom: '1px solid rgba(201,168,76,0.15)',
        background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', flexShrink: 0,
      }}>
        <div style={{
          width: 42, height: 42, background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(201,168,76,0.5)', flexShrink: 0,
        }}>
          <Scissors size={19} color="#1A1A2E" />
        </div>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontSize: '1.15rem', color: '#C9A84C', fontFamily: 'Playfair Display, serif' }}>
            S &amp; See Signature Salon
          </h1>
          <p style={{ margin: 0, color: '#E8D5A3', fontSize: '0.6rem' }}>AI Hairstyle Studio | Avadi, Chennai</p>
        </div>

        {/* SEARCH BAR */}
        <div style={{ position: 'relative', width: 280, marginLeft: 16 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#C9A84C' }} />
          <input
            ref={searchRef} type="text" placeholder="Search hairstyles... (buzz, fade, volume, pompadour...)"
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setFilterTag(null) }}
            style={{
              width: '100%', padding: '8px 34px 8px 34px',
              background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(201,168,76,0.3)',
              borderRadius: 20, color: 'white', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', outline: 'none',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* TAG FILTERS */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
          {Object.entries(TAG_LABELS).map(([key, { label, color }]) => (
            <button key={key} onClick={() => { setFilterTag(filterTag === key ? null : key); setSearchQuery('') }}
              style={{
                padding: '5px 10px', borderRadius: 14, fontSize: '0.65rem', fontWeight: 600,
                border: `1.5px solid ${filterTag === key ? color : 'rgba(255,255,255,0.1)'}`,
                background: filterTag === key ? `${color}22` : 'transparent',
                color: filterTag === key ? color : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >{label}</button>
          ))}
        </div>

        {/* Scan stats */}
        {segmentationMask && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#C9A84C' }}>{hairPixelCount.toLocaleString()}</div>
              <div style={{ fontSize: '0.5rem', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Hair px</div>
            </div>
            <div style={{ width: 1, height: 24, background: 'rgba(201,168,76,0.2)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4CAF50' }}>{scanCoverage}%</div>
              <div style={{ fontSize: '0.5rem', color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>Scanned</div>
            </div>
          </div>
        )}

        {/* AI Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: segmentationMask ? 8 : 'auto' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: modelReady ? '#4CAF50' : modelLoading ? '#FFC107' : '#F44336',
            boxShadow: modelReady ? '0 0 6px #4CAF50' : 'none',
          }} />
          <span style={{ fontSize: '0.58rem', color: '#555' }}>
            {modelReady ? 'AI Ready' : modelLoading ? 'Loading...' : 'Offline'}
          </span>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontSize: '1.1rem', color: '#C9A84C', fontFamily: 'monospace', fontWeight: 700 }}>
            {currentTime.toLocaleTimeString('en-IN')}
          </div>
        </div>

        {/* Live Hair Color button */}
        <button
          onClick={() => navigate('/live-hair')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 10,
            background: 'linear-gradient(135deg, #C9A84C, #A88B3D)',
            border: 'none', borderRadius: 20, padding: '7px 14px',
            color: '#0a0a0a', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 14px rgba(201,168,76,0.4)',
          }}
        >
          <Video size={13} />
          Live Color
        </button>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: PREVIEW */}
        {clientPhoto ? (
          <div style={{
            width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column',
            borderRight: '1px solid rgba(201,168,76,0.2)',
            background: 'rgba(0,0,0,0.25)', padding: '12px 14px', gap: 8, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: segmentationMask ? 'rgba(76,175,80,0.15)' : 'rgba(201,168,76,0.15)',
                border: `1px solid ${segmentationMask ? 'rgba(76,175,80,0.4)' : 'rgba(201,168,76,0.4)'}`,
                borderRadius: 16, padding: '3px 12px',
                fontSize: '0.6rem', color: segmentationMask ? '#4CAF50' : '#C9A84C', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: segmentationMask ? '#4CAF50' : '#FFC107', animation: segmentationMask ? 'none' : 'pulse 1.5s infinite' }} />
                {segmentationMask ? 'Hair & Scalp Scanned' : 'Scanning...'}
              </div>
            </div>

            {/* Before / After */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.7)', color: '#aaa', padding: '2px 7px', borderRadius: 6, fontSize: '0.55rem', fontWeight: 700, zIndex: 2 }}>ORIGINAL</div>
                <img src={clientPhoto} alt="Original" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 10, border: '2px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(201,168,76,0.85)', color: '#1A1A2E', padding: '2px 7px', borderRadius: 6, fontSize: '0.55rem', fontWeight: 700, zIndex: 2 }}>NEW STYLE</div>
                {isLoading ? (
                  <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: 10, border: '2px solid #C9A84C', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', gap: 6 }}>
                    <Loader size={20} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '0.6rem', color: '#C9A84C' }}>{modelLoading ? 'Loading AI...' : 'Processing...'}</span>
                  </div>
                ) : (
                  <img src={processedImages[currentKey] || clientPhoto} alt="Styled"
                    style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 10, border: '2px solid #C9A84C', boxShadow: '0 0 20px rgba(201,168,76,0.2)', transition: 'all 0.4s ease' }} />
                )}
              </div>
            </div>

            {/* Style info */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: '1.3rem' }}>{currentStyle.badge}</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display, serif' }}>{currentStyle.title}</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: '#777', margin: '3px 0 5px' }}>{currentStyle.desc}</p>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                {currentStyle.erode && <span style={{ fontSize: '0.52rem', background: 'rgba(255,87,34,0.15)', color: '#FF5722', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>SHORT CUT</span>}
                {currentStyle.dilate && <span style={{ fontSize: '0.52rem', background: 'rgba(76,175,80,0.15)', color: '#4CAF50', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>VOLUME+</span>}
                {currentStyle.fade && <span style={{ fontSize: '0.52rem', background: 'rgba(33,150,243,0.15)', color: '#2196F3', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>FADE</span>}
                <span style={{ fontSize: '0.52rem', background: 'rgba(201,168,76,0.12)', color: '#C9A84C', padding: '2px 7px', borderRadius: 8, fontWeight: 600 }}>
                  {TAG_LABELS[currentStyle.tag]?.label.toUpperCase()}
                </span>
              </div>
            </div>

            {/* ===== AI ANALYSIS RESULTS ===== */}
            {(aiLoading || faceShape) && (
              <div style={{ 
                background: 'rgba(201,168,76,0.08)', 
                border: '1px solid rgba(201,168,76,0.2)', 
                borderRadius: 12, 
                padding: '10px 12px',
                marginTop: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Brain size={14} color="#C9A84C" />
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1 }}>
                    DL Model Analysis
                  </span>
                  {aiLoading && <Loader size={12} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />}
                  {!aiLoading && analysisConfidence > 0 && (
                    <span style={{ fontSize: '0.55rem', background: 'rgba(76,175,80,0.2)', color: '#4CAF50', padding: '2px 6px', borderRadius: 4, marginLeft: 'auto' }}>
                      {Math.round(analysisConfidence * 100)}% Accuracy
                    </span>
                  )}
                </div>

                {!aiLoading && (
                  <>
                    {/* Face Shape Detection */}
                    {faceShape && faceShape.shape !== 'unknown' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Target size={12} color="#E8D5A3" />
                        <span style={{ fontSize: '0.6rem', color: '#888' }}>Face Shape:</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#E8D5A3', textTransform: 'capitalize' }}>
                          {faceShape.shape}
                        </span>
                        <span style={{ fontSize: '0.5rem', color: '#666', marginLeft: 'auto' }}>
                          Confidence: {Math.round(faceShape.confidence * 100)}%
                        </span>
                      </div>
                    )}

                    {/* Hair Type Detection */}
                    {hairType && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Sparkles size={12} color="#4CAF50" />
                        <span style={{ fontSize: '0.6rem', color: '#888' }}>Hair Type:</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4CAF50', textTransform: 'capitalize' }}>
                          {hairType.estimatedThickness} • {hairType.estimatedVolume} volume
                        </span>
                      </div>
                    )}

                    {/* AI Recommendations */}
                    {aiRecommendations && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(201,168,76,0.1)' }}>
                        <span style={{ fontSize: '0.58rem', color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Suggestions:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {aiRecommendations.suitableStyles?.slice(0, 3).map((style, i) => (
                            <span key={i} style={{ fontSize: '0.52rem', background: 'rgba(76,175,80,0.15)', color: '#4CAF50', padding: '2px 6px', borderRadius: 6 }}>
                              ✓ {style}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Client */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
              <User size={12} color="#C9A84C" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#C9A84C' }}>{clientName || 'Guest'}</span>
            </div>

            {/* Style dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
              {HAIRSTYLES.map((_, i) => (
                <button key={i} onClick={() => setSelectedStyle(i)} style={{
                  width: selectedStyle % HAIRSTYLES.length === i ? 16 : 5, height: 5, borderRadius: 3,
                  background: selectedStyle % HAIRSTYLES.length === i ? '#C9A84C' : 'rgba(255,255,255,0.12)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0,
                }} />
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            width: 320, flexShrink: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderRight: '1px solid rgba(201,168,76,0.1)',
            background: 'rgba(0,0,0,0.2)', padding: 24, gap: 14, textAlign: 'center',
          }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px dashed rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}>
              <Camera size={32} color="rgba(201,168,76,0.35)" />
            </div>
            <p style={{ color: '#C9A84C', fontSize: '0.9rem', fontWeight: 700, marginBottom: 2 }}>Ready to Scan</p>
            <p style={{ color: '#555', fontSize: '0.78rem', lineHeight: 1.6 }}>
              Take a photo and tap<br /><strong style={{ color: '#C9A84C' }}>"View on TV"</strong><br />
              AI scans your hair &amp; scalp<br />and shows {HAIRSTYLES.length} hairstyle previews
            </p>
            <Tv size={20} color="rgba(201,168,76,0.25)" />
          </div>
        )}

        {/* RIGHT: HAIRSTYLE GRID */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Sparkles size={13} color="#C9A84C" />
            <span style={{ fontSize: '0.68rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
              World Hairstyle Collection
            </span>
            <span style={{ fontSize: '0.58rem', color: '#555', marginLeft: 'auto' }}>
              {filteredStyles.length} of {HAIRSTYLES.length} styles
            </span>
          </div>

          {filteredStyles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
              <Search size={28} color="#333" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: '0.85rem' }}>No styles found for "{searchQuery || filterTag}"</p>
              <button onClick={() => { setSearchQuery(''); setFilterTag(null) }}
                style={{ marginTop: 10, padding: '6px 16px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 10, color: '#C9A84C', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Inter' }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))',
              gap: 9,
            }}>
              {filteredStyles.map((style) => {
                const realIdx = HAIRSTYLES.indexOf(style)
                const isActive = realIdx === (selectedStyle % HAIRSTYLES.length) && clientPhoto
                const pKey = `style_${realIdx}`
                const tagInfo = TAG_LABELS[style.tag]
                return (
                  <div key={style.title} onClick={() => setSelectedStyle(realIdx)}
                    style={{
                      background: isActive ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1.5px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.06)'}`,
                      borderRadius: 10, padding: 7, cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? '0 0 16px rgba(201,168,76,0.15)' : 'none',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {clientPhoto && processedImages[pKey] ? (
                      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 7, overflow: 'hidden', marginBottom: 5, border: `1px solid ${isActive ? '#C9A84C' : 'rgba(201,168,76,0.08)'}` }}>
                        <img src={processedImages[pKey]} alt={style.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : clientPhoto ? (
                      <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(201,168,76,0.08)' }}>
                        <Loader size={13} style={{ color: '#C9A84C', animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: '100%', aspectRatio: '4/3', borderRadius: 7,
                        background: 'linear-gradient(135deg, rgba(201,168,76,0.04), rgba(201,168,76,0.1))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 5, fontSize: '1.6rem',
                      }}>
                        {style.badge}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span style={{ fontSize: '0.82rem' }}>{style.badge}</span>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: isActive ? '#C9A84C' : '#ccc', fontFamily: 'Playfair Display, serif', lineHeight: 1.2 }}>
                        {style.title}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.54rem', color: '#666', margin: 0, lineHeight: 1.3 }}>{style.desc}</p>

                    <div style={{ display: 'flex', gap: 3, marginTop: 3 }}>
                      <span style={{ fontSize: '0.46rem', background: `${tagInfo.color}18`, color: tagInfo.color, padding: '1px 5px', borderRadius: 5, fontWeight: 600 }}>{tagInfo.label.toUpperCase()}</span>
                      {style.erode && style.fade && <span style={{ fontSize: '0.46rem', background: 'rgba(255,87,34,0.1)', color: '#FF5722', padding: '1px 5px', borderRadius: 5, fontWeight: 600 }}>CUT+FADE</span>}
                      {style.dilate && style.fade && <span style={{ fontSize: '0.46rem', background: 'rgba(76,175,80,0.1)', color: '#4CAF50', padding: '1px 5px', borderRadius: 5, fontWeight: 600 }}>VOL+FADE</span>}
                    </div>

                    {isActive && (
                      <div style={{ position: 'absolute', top: 5, right: 5, background: '#C9A84C', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#1A1A2E' }}>✓</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '6px 28px', borderTop: '1px solid rgba(201,168,76,0.08)',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, color: '#444', fontSize: '0.6rem', flexShrink: 0,
      }}>
        <Sparkles size={9} color="#C9A84C" />
        MediaPipe DL Hair Removal + Inpainting | {HAIRSTYLES.length} Hairstyle Replacements | Real Hair Swap Filter
        <Sparkles size={9} color="#C9A84C" />
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
