// Real-time hairstyle preview — live webcam, MediaPipe mask, per-pixel style FX
// No strand overlay, no wig. Original hair texture preserved; style FX applied as pixel ops.

import { useEffect, useRef, useState } from 'react'
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision'
import { useNavigate } from 'react-router-dom'

const HAIR_CAT = 1
const FACE_CAT = 3
const BODY_CAT = 2

// Same 47 hairstyles as TVDisplay
const HAIRSTYLES = [
  // BUZZ
  { title: 'Buzz Cut',         desc: 'Uniform all-over buzz',             badge: '⚡', tag: 'buzz', erode: 8 },
  { title: 'Induction Cut',    desc: 'Military shaved near-zero',         badge: '🎖️', tag: 'buzz', erode: 10 },
  { title: 'Butch Cut',        desc: 'Slightly longer uniform buzz',      badge: '💪', tag: 'buzz', erode: 6 },
  { title: 'Burr Cut',         desc: 'Short even texture all over',       badge: '🌾', tag: 'buzz', erode: 7 },
  { title: 'US Crew Cut',      desc: 'American flat-top crew',            badge: '🇺🇸', tag: 'buzz', erode: 5 },
  // SHORT
  { title: 'Crew Cut',         desc: 'American classic tapered short',    badge: '🇺🇸', tag: 'short', erode: 4 },
  { title: 'Ivy League',       desc: 'Preppy longer crew cut',            badge: '🎓', tag: 'short', erode: 3 },
  { title: 'Caesar Cut',       desc: 'Roman-inspired short fringe',       badge: '🏛️', tag: 'short', erode: 4, fade: 0.15 },
  { title: 'French Crop',      desc: 'European textured short crop',      badge: '🇫🇷', tag: 'short', erode: 3, fade: 0.12 },
  { title: 'Edgar Cut',        desc: 'Sharp straight fringe line',        badge: '📏', tag: 'short', erode: 3, fade: 0.20 },
  { title: 'Regulation Cut',   desc: 'Military regulation standard',      badge: '🪖', tag: 'short', erode: 4, fade: 0.18 },
  // FADE
  { title: 'Skin Fade',        desc: 'Bald fade to skin on sides',        badge: '🔥', tag: 'fade', fade: 0.58 },
  { title: 'High Fade',        desc: 'Fade starts high on temple',        badge: '📐', tag: 'fade', fade: 0.52 },
  { title: 'Mid Fade',         desc: 'Clean fade at mid level',           badge: '⚖️', tag: 'fade', fade: 0.42 },
  { title: 'Low Fade',         desc: 'Subtle taper at lower sides',       badge: '📉', tag: 'fade', fade: 0.28 },
  { title: 'Taper Fade',       desc: 'Gradual classic taper',             badge: '📊', tag: 'fade', fade: 0.32 },
  { title: 'Drop Fade',        desc: 'Drops behind the ear arc',          badge: '💧', tag: 'fade', fade: 0.48 },
  { title: 'Burst Fade',       desc: 'Radiates around the ear',           badge: '💥', tag: 'fade', fade: 0.55 },
  { title: 'Temple Fade',      desc: 'Cleans up just the temples',        badge: '🎯', tag: 'fade', fade: 0.20 },
  { title: 'Shadow Fade',      desc: 'Very gradual subtle blend',         badge: '🌑', tag: 'fade', fade: 0.25 },
  { title: 'Bald Fade',        desc: 'Fades completely to skin',          badge: '✨', tag: 'fade', fade: 0.62 },
  // VOLUME
  { title: 'Pompadour',        desc: 'Elvis-style swept-up volume',       badge: '👑', tag: 'volume', dilate: 5 },
  { title: 'Quiff',            desc: 'British swept-up front volume',     badge: '🇬🇧', tag: 'volume', dilate: 4 },
  { title: 'Blowout',          desc: 'Italian voluminous blow dry',       badge: '🇮🇹', tag: 'volume', dilate: 6 },
  { title: 'Afro',             desc: 'Natural full rounded afro',         badge: '✊', tag: 'volume', dilate: 8 },
  { title: 'Fluffy Hair',      desc: 'Korean soft fluffy volume',         badge: '🇰🇷', tag: 'volume', dilate: 4 },
  { title: 'Curtain Bangs',    desc: 'Middle part with volume',           badge: '🎭', tag: 'volume', dilate: 3 },
  { title: 'Shag Cut',         desc: '70s layered shaggy texture',        badge: '🎸', tag: 'volume', dilate: 5 },
  { title: 'Wolf Cut',         desc: 'Trendy messy layered volume',       badge: '🐺', tag: 'volume', dilate: 6 },
  { title: 'Mullet',           desc: 'Business front, party back',        badge: '🤘', tag: 'volume', dilate: 5, fade: 0.15 },
  { title: 'Jewfro',           desc: 'Curly natural volume style',        badge: '🌀', tag: 'volume', dilate: 7 },
  { title: 'Mop Top',          desc: 'Beatles-inspired full length',      badge: '🎵', tag: 'volume', dilate: 4 },
  { title: 'Surfer Hair',      desc: 'Beach-style natural flow',          badge: '🏄', tag: 'volume', dilate: 3 },
  { title: 'K-Pop Volume',     desc: 'Korean idol voluminous style',      badge: '🎤', tag: 'volume', dilate: 5 },
  { title: 'Natural Boost',    desc: 'Your natural hair + body',          badge: '💫', tag: 'volume', dilate: 3 },
  { title: 'Big Hair',         desc: 'Maximum oversized volume',          badge: '🦁', tag: 'volume', dilate: 9 },
  // COMBO
  { title: 'Fade + Buzz Top',  desc: 'Faded sides with buzz on top',      badge: '⚡', tag: 'combo', erode: 2, fade: 0.45 },
  { title: 'Military Fade',    desc: 'Strict military with fade',         badge: '🎖️', tag: 'combo', erode: 3, fade: 0.50 },
  { title: 'Executive Cut',    desc: 'Boardroom-ready trim',              badge: '👔', tag: 'combo', erode: 1, fade: 0.22 },
  { title: 'Gentleman Taper',  desc: 'Classic tapered short sides',       badge: '🎩', tag: 'combo', erode: 2, fade: 0.30 },
  { title: 'Pompadour Fade',   desc: 'Volume on top + faded sides',       badge: '🌟', tag: 'combo', dilate: 3, fade: 0.40 },
  { title: 'Quiff Fade',       desc: 'Front volume + clean fade',         badge: '💎', tag: 'combo', dilate: 2, fade: 0.35 },
  { title: 'Mohawk Fade',      desc: 'Central strip + skin sides',        badge: '🦅', tag: 'combo', dilate: 3, fade: 0.58 },
  { title: 'Faux Hawk Fade',   desc: 'Softer mohawk with fade',           badge: '🦊', tag: 'combo', dilate: 2, fade: 0.48 },
  { title: 'Undercut',         desc: 'Volume on top, short sides',        badge: '🔪', tag: 'combo', dilate: 2, fade: 0.52 },
  { title: 'Disconnected Cut', desc: 'Dramatic top-side contrast',        badge: '⚔️', tag: 'combo', dilate: 4, fade: 0.55 },
  { title: 'Textured Top Fade',desc: 'Textured top with mid fade',        badge: '🌊', tag: 'combo', dilate: 2, fade: 0.38 },
  { title: 'Modern Mullet Fade',desc:'Updated mullet with fade',          badge: '🎶', tag: 'combo', dilate: 4, fade: 0.30 },
]

const TAG_COLORS = {
  buzz:   '#FF5722',
  short:  '#FF9800',
  fade:   '#2196F3',
  volume: '#4CAF50',
  combo:  '#9C27B0',
}

// ── Noise helper (stable per pixel, no flicker) ───────────────────────────────
function noise(x, y) { return ((x * 1973 + y * 9301 + 49297) % 233280) / 233280 - 0.5 }

// ── Per-pixel style effect applied to hair pixels in real-time ────────────────
function applyPixelEffect(px, idx, x, y, hb, style, skin) {
  let r = px[idx], g = px[idx + 1], b = px[idx + 2]

  const hw = Math.max(1, hb.maxX - hb.minX)
  const hh = Math.max(1, hb.maxY - hb.minY)
  const nx = Math.max(0, Math.min(1, (x - hb.minX) / hw))
  const ny = Math.max(0, Math.min(1, (y - hb.minY) / hh))

  const erode  = style.erode  || 0
  const dilate = style.dilate || 0
  const fade   = style.fade   || 0

  // BUZZ / SHORT — heavy skin blend = stubble appearance
  if (erode >= 1) {
    const blend = Math.min(0.92, 0.55 + erode * 0.044)
    const n = noise(x, y) * 18
    r = Math.round(r * (1 - blend) + (skin.r + n)     * blend)
    g = Math.round(g * (1 - blend) + (skin.g + n*0.8) * blend)
    b = Math.round(b * (1 - blend) + (skin.b + n*0.5) * blend)
    if (noise(x * 3, y * 3) > 0.35) {
      const dark = 1 - blend * 0.7
      r = Math.max(0, Math.round(r * dark))
      g = Math.max(0, Math.round(g * dark))
      b = Math.max(0, Math.round(b * dark))
    }
  }

  // FADE — linear gradient, sides blend to skin
  if (fade > 0) {
    const fromL   = Math.max(0, 1 - nx / fade)
    const fromR   = Math.max(0, 1 - (1 - nx) / fade)
    const fadeFac = Math.max(fromL, fromR)
    r = Math.round(r * (1 - fadeFac) + skin.r * fadeFac)
    g = Math.round(g * (1 - fadeFac) + skin.g * fadeFac)
    b = Math.round(b * (1 - fadeFac) + skin.b * fadeFac)
  }

  // VOLUME — edge brightness lift (puffed/fuller look)
  if (dilate >= 3) {
    const edgeDist  = Math.min(nx, 1 - nx, ny, 0.5)
    const edgeFac   = 1 - Math.min(1, edgeDist / 0.25)
    const centBoost = 1 + dilate * 0.022
    const edgeBoost = 1 + edgeFac * dilate * 0.04
    r = Math.min(255, Math.round(r * centBoost * edgeBoost))
    g = Math.min(255, Math.round(g * centBoost * edgeBoost))
    b = Math.min(255, Math.round(b * centBoost * edgeBoost))
  }

  px[idx]   = Math.max(0, Math.min(255, r))
  px[idx+1] = Math.max(0, Math.min(255, g))
  px[idx+2] = Math.max(0, Math.min(255, b))
}

// ── Percentile hair bounds (excludes headphone bands) ────────────────────────
function computeHairBounds(mask, mw, mh, vw, vh) {
  const xs = [], ys = []
  for (let my = 0; my < mh; my++)
    for (let mx = 0; mx < mw; mx++)
      if (mask[my * mw + mx] === HAIR_CAT) { xs.push(mx); ys.push(my) }
  if (!xs.length) return null
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b)
  const p = (arr, pct) => arr[Math.max(0, Math.min(arr.length - 1, Math.round(arr.length * pct)))]
  const sx = vw / mw, sy = vh / mh
  return {
    minX: p(xs, 0.06) * sx, maxX: p(xs, 0.94) * sx,
    minY: p(ys, 0.03) * sy, maxY: p(ys, 0.95) * sy,
  }
}

// ── Sample skin tone from mask ────────────────────────────────────────────────
function sampleSkin(px, mask, mw, mh, vw, vh) {
  let sr = 0, sg = 0, sb = 0, sc = 0
  const step = 4
  for (let my = 0; my < mh; my += step) {
    for (let mx = 0; mx < mw; mx += step) {
      const cat = mask[my * mw + mx]
      if (cat !== FACE_CAT && cat !== BODY_CAT) continue
      const ix = Math.min(Math.round((mx / mw) * vw), vw - 1)
      const iy = Math.min(Math.round((my / mh) * vh), vh - 1)
      const pi = (iy * vw + ix) * 4
      sr += px[pi]; sg += px[pi + 1]; sb += px[pi + 2]; sc++
    }
  }
  return sc > 0
    ? { r: Math.round(sr / sc), g: Math.round(sg / sc), b: Math.round(sb / sc) }
    : { r: 185, g: 148, b: 120 }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LiveHairColor() {
  const navigate    = useNavigate()
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const segRef      = useRef(null)
  const maskRef     = useRef(null)
  const maskWRef    = useRef(0)
  const maskHRef    = useRef(0)
  const skinRef     = useRef({ r: 185, g: 148, b: 120 })
  const hbRef       = useRef(null)
  const rafRef      = useRef(null)
  const frameRef    = useRef(0)
  const busyRef     = useRef(false)
  const styleRef    = useRef(HAIRSTYLES[0])

  const [style,     setStyle]    = useState(HAIRSTYLES[0])
  const [tag,       setTag]      = useState(null)
  const [status,    setStatus]   = useState('Loading AI model…')
  const [camReady,  setCamReady] = useState(false)

  useEffect(() => { styleRef.current = style }, [style])

  // ── Load MediaPipe VIDEO mode ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        )
        const seg = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        })
        if (!cancelled) {
          segRef.current = seg
          setStatus('Starting camera…')
        }
      } catch (e) {
        if (!cancelled) setStatus('Model failed: ' + e.message)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // ── Webcam ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!segRef.current) return
    let stream
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(s => {
        stream = s
        videoRef.current.srcObject = s
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          setCamReady(true)
          setStatus('Live preview ready')
        }
      })
      .catch(e => setStatus('Camera: ' + e.message))
    return () => {
      stream?.getTracks().forEach(t => t.stop())
      cancelAnimationFrame(rafRef.current)
    }
  }, [!!segRef.current]) // eslint-disable-line

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!camReady) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d', { willReadFrequently: true })

    function tick() {
      if (!video.videoWidth) { rafRef.current = requestAnimationFrame(tick); return }

      const vw = video.videoWidth
      const vh = video.videoHeight
      if (canvas.width !== vw)  canvas.width  = vw
      if (canvas.height !== vh) canvas.height = vh

      // Draw mirrored camera frame
      ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -vw, 0, vw, vh); ctx.restore()

      // Segmentation every 3 frames
      frameRef.current++
      if (frameRef.current % 3 === 0 && segRef.current && !busyRef.current) {
        busyRef.current = true
        try {
          const res = segRef.current.segmentForVideo(video, performance.now())
          if (res?.categoryMask) {
            maskRef.current  = res.categoryMask.getAsUint8Array()
            maskWRef.current = res.categoryMask.width
            maskHRef.current = res.categoryMask.height
            res.categoryMask.close()
          }
        } catch (_) {}
        busyRef.current = false
      }

      // Apply style pixel effect to hair region
      if (maskRef.current && maskWRef.current > 0) {
        const mask = maskRef.current
        const mw   = maskWRef.current
        const mh   = maskHRef.current
        const st   = styleRef.current

        const id = ctx.getImageData(0, 0, vw, vh)
        const px = id.data

        // Sample skin every 15 frames
        if (frameRef.current % 15 === 0) {
          skinRef.current = sampleSkin(px, mask, mw, mh, vw, vh)
          hbRef.current   = computeHairBounds(mask, mw, mh, vw, vh)
        }
        const skin = skinRef.current
        const hb   = hbRef.current

        if (hb) {
          for (let y = 0; y < vh; y++) {
            const my = Math.min(Math.floor(y * mh / vh), mh - 1)
            for (let x = 0; x < vw; x++) {
              // Mirror mask lookup to match mirrored canvas
              const mx = Math.min(Math.floor((vw - 1 - x) * mw / vw), mw - 1)
              if (mask[my * mw + mx] !== HAIR_CAT) continue
              applyPixelEffect(px, (y * vw + x) * 4, x, y, hb, st, skin)
            }
          }
        }
        ctx.putImageData(id, 0, 0)

        // Style name overlay on top-right
        ctx.fillStyle   = 'rgba(0,0,0,0.55)'
        ctx.fillRect(vw - 200, 10, 190, 48)
        ctx.fillStyle   = TAG_COLORS[st.tag] || '#C9A84C'
        ctx.font        = 'bold 15px Inter, sans-serif'
        ctx.fillText(st.badge + ' ' + st.title, vw - 190, 32)
        ctx.fillStyle   = 'rgba(255,255,255,0.65)'
        ctx.font        = '11px Inter, sans-serif'
        ctx.fillText(st.desc, vw - 190, 50)
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [camReady])

  const filtered = tag ? HAIRSTYLES.filter(h => h.tag === tag) : HAIRSTYLES

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif', color: 'white',
    }}>
      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid #1f1f1f',
        flexShrink: 0,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: '1px solid #333', color: '#aaa',
          borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12,
        }}>← Back</button>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#C9A84C' }}>Live Hairstyle Preview</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: '#555',
          background: '#111', padding: '3px 10px', borderRadius: 20,
        }}>{status}</span>
      </div>

      {/* ── Camera ── */}
      <div style={{ position: 'relative', width: '100%', background: '#000', flexShrink: 0 }}>
        <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
        <canvas ref={canvasRef} style={{ width: '100%', display: 'block', maxHeight: '55vh', objectFit: 'contain' }} />

        {!camReady && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12, background: '#0a0a0a',
            minHeight: 280,
          }}>
            <div style={{
              width: 44, height: 44, border: '4px solid #C9A84C',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: '#555', margin: 0, fontSize: 13 }}>{status}</p>
          </div>
        )}
      </div>

      {/* ── Style picker ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '10px 12px 0' }}>
        {/* Tag filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexShrink: 0 }}>
          <button
            onClick={() => setTag(null)}
            style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: !tag ? '#C9A84C' : 'transparent',
              color: !tag ? '#000' : '#666',
              border: !tag ? 'none' : '1px solid #2a2a2a',
            }}
          >All</button>
          {Object.entries(TAG_COLORS).map(([key, col]) => (
            <button key={key} onClick={() => setTag(tag === key ? null : key)} style={{
              padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: tag === key ? col : 'transparent',
              color: tag === key ? '#fff' : '#555',
              border: tag === key ? 'none' : `1px solid ${col}44`,
            }}>
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        {/* Style grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 6, overflowY: 'auto', paddingBottom: 16,
          flex: 1,
        }}>
          {filtered.map((s, i) => {
            const active = style.title === s.title
            return (
              <button
                key={s.title}
                onClick={() => setStyle(s)}
                style={{
                  background: active ? '#1a1400' : '#111',
                  border: active ? `1.5px solid ${TAG_COLORS[s.tag]}` : '1.5px solid #1e1e1e',
                  borderRadius: 10, padding: '8px 10px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'border 0.12s, background 0.12s',
                  boxShadow: active ? `0 0 10px ${TAG_COLORS[s.tag]}44` : 'none',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 3 }}>{s.badge}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: active ? TAG_COLORS[s.tag] : '#ddd',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{s.title}</div>
                <div style={{
                  fontSize: 10, color: '#444', marginTop: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{s.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
