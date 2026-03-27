// ===== REAL HAIR STYLE EFFECTS =====
// No synthetic strands. No wig. Original hair pixels — strong per-style FX.
// Volume styles: canvas-blur expansion halo (hair looks bigger/fuller).
// Buzz/Short: aggressive skin-blend (looks actually shaved/short).
// Fade: full side gradient to skin (clearly visible fade lines).

const HAIR = 1, FACE = 3, BODY = 2

function pct(arr, p) {
  return arr[Math.max(0, Math.min(arr.length - 1, Math.round(arr.length * p)))]
}

// ── Sample skin tone ──────────────────────────────────────────────────────────
function sampleSkin(pixels, imgW, imgH, maskData, maskW, maskH) {
  let sr = 0, sg = 0, sb = 0, sc = 0
  for (let mi = 0; mi < maskW * maskH; mi += 3) {
    if (maskData[mi] !== FACE && maskData[mi] !== BODY) continue
    const mx = mi % maskW, my = Math.floor(mi / maskW)
    const ix = Math.min(Math.round((mx / maskW) * imgW), imgW - 1)
    const iy = Math.min(Math.round((my / maskH) * imgH), imgH - 1)
    const pi = (iy * imgW + ix) * 4
    sr += pixels[pi]; sg += pixels[pi + 1]; sb += pixels[pi + 2]; sc++
  }
  return sc > 0
    ? { r: Math.round(sr / sc), g: Math.round(sg / sc), b: Math.round(sb / sc) }
    : { r: 185, g: 148, b: 120 }
}

// ── Percentile bounds — excludes headphone bands ──────────────────────────────
function getHairBounds(maskData, maskW, maskH, imgW, imgH) {
  const xs = [], ys = []
  for (let my = 0; my < maskH; my++)
    for (let mx = 0; mx < maskW; mx++)
      if (maskData[my * maskW + mx] === HAIR) { xs.push(mx); ys.push(my) }
  if (!xs.length) return null
  xs.sort((a, b) => a - b); ys.sort((a, b) => a - b)
  const sx = imgW / maskW, sy = imgH / maskH
  return {
    minX: pct(xs, 0.06) * sx, maxX: pct(xs, 0.94) * sx,
    minY: pct(ys, 0.03) * sy, maxY: pct(ys, 0.95) * sy,
  }
}

// Stable per-pixel noise (no flicker)
function noise(x, y) { return ((x * 1973 + y * 9301 + 49297) % 233280) / 233280 - 0.5 }

// ── Per-pixel effect ──────────────────────────────────────────────────────────
function applyPixelEffect(px, idx, x, y, hb, style, skin) {
  let r = px[idx], g = px[idx + 1], b = px[idx + 2]

  const hw  = Math.max(1, hb.maxX - hb.minX)
  const hh  = Math.max(1, hb.maxY - hb.minY)
  const nx  = Math.max(0, Math.min(1, (x - hb.minX) / hw))
  const ny  = Math.max(0, Math.min(1, (y - hb.minY) / hh))

  const erode  = style.erode  || 0
  const dilate = style.dilate || 0
  const fade   = style.fade   || 0

  // ── BUZZ / SHORT: aggressive blend toward skin = near-shaved look ──────────
  if (erode >= 1) {
    const blend = Math.min(0.97, 0.62 + erode * 0.036)   // erode1→0.66, erode10→0.98
    const n     = noise(x, y) * 14
    r = Math.round(r * (1 - blend) + Math.min(255, skin.r + n)     * blend)
    g = Math.round(g * (1 - blend) + Math.min(255, skin.g + n*0.8) * blend)
    b = Math.round(b * (1 - blend) + Math.min(255, skin.b + n*0.5) * blend)
    // Bristle texture: dark dots scattered in the blend to simulate shadow
    const bristle = noise(x * 4, y * 4)
    if (bristle > 0.30) {
      const darken = Math.max(0, 1 - blend * 0.75)
      r = Math.round(r * darken)
      g = Math.round(g * darken)
      b = Math.round(b * darken)
    }
  }

  // ── FADE: strong linear gradient — sides fully blend to skin ──────────────
  if (fade > 0) {
    const fromL   = Math.max(0, 1 - nx / fade)
    const fromR   = Math.max(0, 1 - (1 - nx) / fade)
    const fadeFac = Math.max(fromL, fromR)   // linear, no power curve = stronger
    r = Math.round(r * (1 - fadeFac) + skin.r * fadeFac)
    g = Math.round(g * (1 - fadeFac) + skin.g * fadeFac)
    b = Math.round(b * (1 - fadeFac) + skin.b * fadeFac)
  }

  // ── VOLUME: bright lift + edge puff — makes hair look fuller/bigger ───────
  if (dilate >= 3) {
    const edgeDist  = Math.min(nx, 1 - nx, ny, 0.5)
    const edgeFac   = 1 - Math.min(1, edgeDist / 0.22)
    const centBoost = 1 + dilate * 0.025
    const edgeBoost = 1 + edgeFac * dilate * 0.05
    r = Math.min(255, Math.round(r * centBoost * edgeBoost))
    g = Math.min(255, Math.round(g * centBoost * edgeBoost))
    b = Math.min(255, Math.round(b * centBoost * edgeBoost))
  }

  px[idx]   = Math.max(0, Math.min(255, r))
  px[idx+1] = Math.max(0, Math.min(255, g))
  px[idx+2] = Math.max(0, Math.min(255, b))
}

// ── Public API ────────────────────────────────────────────────────────────────

export function prepareHairBase(imageEl, maskData, maskW, maskH) {
  const imgW = imageEl.naturalWidth  || imageEl.width
  const imgH = imageEl.naturalHeight || imageEl.height

  const orig = document.createElement('canvas')
  orig.width = imgW; orig.height = imgH
  orig.getContext('2d').drawImage(imageEl, 0, 0, imgW, imgH)

  const origPx = orig.getContext('2d').getImageData(0, 0, imgW, imgH).data
  const skin   = sampleSkin(origPx, imgW, imgH, maskData, maskW, maskH)
  const hb     = getHairBounds(maskData, maskW, maskH, imgW, imgH)

  // Pre-sample average hair color (for volume expansion)
  let hr = 0, hg = 0, hb2 = 0, hc = 0
  for (let mi = 0; mi < maskW * maskH; mi += 4) {
    if (maskData[mi] !== HAIR) continue
    const mx = mi % maskW, my = Math.floor(mi / maskW)
    const ix = Math.min(Math.round((mx / maskW) * imgW), imgW - 1)
    const iy = Math.min(Math.round((my / maskH) * imgH), imgH - 1)
    const pi = (iy * imgW + ix) * 4
    hr += origPx[pi]; hg += origPx[pi + 1]; hb2 += origPx[pi + 2]; hc++
  }
  const avgHairColor = hc > 0
    ? { r: Math.round(hr / hc), g: Math.round(hg / hc), b: Math.round(hb2 / hc) }
    : { r: 30, g: 22, b: 18 }

  return { orig, skin, hb, maskData, maskW, maskH, imgW, imgH, avgHairColor, defaultHairColor: null }
}

export function applyStyleToBase(prepared, style) {
  const { orig, skin, hb, maskData, maskW, maskH, imgW, imgH, avgHairColor } = prepared
  const dilate = style.dilate || 0

  const canvas = document.createElement('canvas')
  canvas.width = imgW; canvas.height = imgH
  const ctx = canvas.getContext('2d')
  ctx.drawImage(orig, 0, 0)

  if (!hb) return canvas.toDataURL('image/jpeg', 0.93)

  // ── VOLUME: draw canvas-blur expansion BEFORE pixel effects ──────────────
  // This creates a real "bigger hair" halo around the actual hair boundary.
  if (dilate >= 3) {
    const blurPx   = dilate * 6   // blur radius: dilate3→18px, dilate9→54px
    const haloAlpha = Math.min(0.80, dilate * 0.085)   // dilate3→0.26, dilate9→0.77

    // Build mask canvas: hair pixels filled with avg hair color
    const mc   = document.createElement('canvas')
    mc.width   = imgW; mc.height = imgH
    const mctx = mc.getContext('2d')
    const mid  = mctx.createImageData(imgW, imgH)
    const mpx  = mid.data
    const { r: hr, g: hg, b: hb2 } = avgHairColor
    for (let y = 0; y < imgH; y++) {
      const my = Math.min(Math.floor(y * maskH / imgH), maskH - 1)
      for (let x = 0; x < imgW; x++) {
        const mx = Math.min(Math.floor(x * maskW / imgW), maskW - 1)
        if (maskData[my * maskW + mx] !== HAIR) continue
        const i = (y * imgW + x) * 4
        mpx[i] = hr; mpx[i + 1] = hg; mpx[i + 2] = hb2; mpx[i + 3] = 255
      }
    }
    mctx.putImageData(mid, 0, 0)

    // Blur the mask → smooth halo extends beyond hair boundary
    const bc   = document.createElement('canvas')
    bc.width   = imgW; bc.height = imgH
    const bctx = bc.getContext('2d')
    bctx.filter = `blur(${blurPx}px)`
    bctx.drawImage(mc, 0, 0)
    bctx.filter = 'none'

    // Composite halo onto main canvas
    ctx.globalAlpha = haloAlpha
    ctx.drawImage(bc, 0, 0)
    ctx.globalAlpha = 1.0

    // Restore face & body pixels (halo must not bleed onto skin/clothes)
    const origData   = orig.getContext('2d').getImageData(0, 0, imgW, imgH)
    const origPixels = origData.data
    const curData    = ctx.getImageData(0, 0, imgW, imgH)
    const curPixels  = curData.data
    for (let y = 0; y < imgH; y++) {
      const my = Math.min(Math.floor(y * maskH / imgH), maskH - 1)
      for (let x = 0; x < imgW; x++) {
        const mx  = Math.min(Math.floor(x * maskW / imgW), maskW - 1)
        const cat = maskData[my * maskW + mx]
        if (cat === HAIR) continue   // keep halo-modified hair
        if (cat === FACE || cat === BODY) {
          const i = (y * imgW + x) * 4
          curPixels[i]   = origPixels[i]
          curPixels[i+1] = origPixels[i+1]
          curPixels[i+2] = origPixels[i+2]
          curPixels[i+3] = origPixels[i+3]
        }
      }
    }
    ctx.putImageData(curData, 0, 0)
  }

  // ── Apply per-pixel effects to hair pixels ────────────────────────────────
  const id = ctx.getImageData(0, 0, imgW, imgH)
  const px = id.data
  for (let y = 0; y < imgH; y++) {
    const my = Math.min(Math.floor(y * maskH / imgH), maskH - 1)
    for (let x = 0; x < imgW; x++) {
      const mx = Math.min(Math.floor(x * maskW / imgW), maskW - 1)
      if (maskData[my * maskW + mx] !== HAIR) continue
      applyPixelEffect(px, (y * imgW + x) * 4, x, y, hb, style, skin)
    }
  }
  ctx.putImageData(id, 0, 0)

  return canvas.toDataURL('image/jpeg', 0.93)
}

// Legacy back-compat
export function applyHairstyleFilter(imageEl, maskData, maskW, maskH, style) {
  return applyStyleToBase(prepareHairBase(imageEl, maskData, maskW, maskH), style)
}
export function removeHairInpaint(imageEl) {
  const c = document.createElement('canvas')
  c.width = imageEl.naturalWidth || imageEl.width
  c.height = imageEl.naturalHeight || imageEl.height
  c.getContext('2d').drawImage(imageEl, 0, 0)
  return c
}
