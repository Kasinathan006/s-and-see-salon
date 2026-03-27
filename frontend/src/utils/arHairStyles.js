// ===== SNAPCHAT-STYLE REALISTIC AR HAIR FILTER =====
// Renders natural-looking hairstyles that blend seamlessly with user's photo

// Main render function - creates realistic AR hairstyle
export function renderARHairstyle(baseImage, faceData, styleKey, hairColor = null) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const w = baseImage.naturalWidth || baseImage.width
  const h = baseImage.naturalHeight || baseImage.height
  canvas.width = w
  canvas.height = h
  
  // Draw original photo first
  ctx.drawImage(baseImage, 0, 0, w, h)
  
  if (!faceData) {
    console.warn('AR Hair: No face data available')
    return canvas.toDataURL('image/jpeg', 0.95)
  }
  
  console.log('AR Hair: Rendering', styleKey, 'at', faceData.centerX, faceData.topY)
  
  // Default natural brown hair color
  const color = hairColor || { r: 55, g: 42, b: 32 }
  
  // Draw hair directly on canvas (not using separate layer for better compatibility)
  drawSnapchatStyleHair(ctx, faceData, styleKey, color)
  
  return canvas.toDataURL('image/jpeg', 0.95)
}

// Draw Snapchat-style realistic hair
function drawSnapchatStyleHair(ctx, faceData, style, color) {
  const { centerX, topY, width, chinY, eyeY, noseY } = faceData
  
  // Adjust positioning based on face
  const hairTop = topY - 15
  const hairWidth = width * 0.9
  
  // Style-specific rendering
  switch(style) {
    case 'buzz':
      drawBuzzCut(ctx, centerX, hairTop, hairWidth, color)
      break
    case 'pompadour':
      drawPompadour(ctx, centerX, hairTop, hairWidth, color)
      break
    case 'quiff':
      drawQuiff(ctx, centerX, hairTop, hairWidth, color)
      break
    case 'fade':
      drawFade(ctx, centerX, hairTop, hairWidth, color, faceData)
      break
    case 'undercut':
      drawUndercut(ctx, centerX, hairTop, hairWidth, chinY, color)
      break
    case 'bob':
      drawBob(ctx, centerX, hairTop, hairWidth, chinY, color)
      break
    case 'long':
    case 'longLayers':
      drawLongHair(ctx, centerX, hairTop, hairWidth, chinY, color)
      break
    case 'pixie':
      drawPixie(ctx, centerX, hairTop, hairWidth, chinY, color)
      break
    case 'fringe':
      drawFringe(ctx, centerX, hairTop, hairWidth, eyeY, color)
      break
    case 'slickback':
      drawSlickBack(ctx, centerX, hairTop, hairWidth, color)
      break
    default:
      drawNaturalHair(ctx, centerX, hairTop, hairWidth, chinY, color)
  }
}

// ===== INDIVIDUAL HAIRSTYLE DRAWERS =====

function drawBuzzCut(ctx, cx, top, w, color) {
  const gradient = ctx.createRadialGradient(cx, top + 10, 0, cx, top + 10, w * 0.6)
  gradient.addColorStop(0, `rgba(${color.r + 20}, ${color.g + 15}, ${color.b + 10}, 0.95)`)
  gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.92)`)
  gradient.addColorStop(1, `rgba(${color.r - 10}, ${color.g - 8}, ${color.b - 5}, 0.85)`)
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(cx, top + 15, w * 0.55, 28, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Short hair texture
  ctx.fillStyle = `rgba(${color.r + 30}, ${color.g + 20}, ${color.b + 15}, 0.3)`
  for (let i = 0; i < 80; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * w * 0.5
    ctx.fillRect(cx + Math.cos(angle) * r, top + 15 + Math.sin(angle) * r * 0.4, 2, 2)
  }
}

function drawPompadour(ctx, cx, top, w, color) {
  // Main volume shape
  const grad = ctx.createLinearGradient(cx, top - 60, cx, top + 30)
  grad.addColorStop(0, `rgba(${color.r + 25}, ${color.g + 20}, ${color.b + 15}, 0.98)`)
  grad.addColorStop(0.4, `rgba(${color.r + 10}, ${color.g + 8}, ${color.b + 5}, 0.95)`)
  grad.addColorStop(0.8, `rgba(${color.r}, ${color.g}, ${color.b}, 0.92)`)
  grad.addColorStop(1, `rgba(${color.r - 5}, ${color.g - 4}, ${color.b - 3}, 0.88)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.55, top + 10)
  ctx.quadraticCurveTo(cx - w * 0.7, top - 55, cx, top - 75)
  ctx.quadraticCurveTo(cx + w * 0.7, top - 55, cx + w * 0.55, top + 10)
  ctx.quadraticCurveTo(cx + w * 0.35, top + 25, cx, top + 20)
  ctx.quadraticCurveTo(cx - w * 0.35, top + 25, cx - w * 0.55, top + 10)
  ctx.closePath()
  ctx.fill()
  
  // Highlight for 3D effect
  const highlight = ctx.createRadialGradient(cx - w * 0.15, top - 35, 0, cx - w * 0.15, top - 35, w * 0.5)
  highlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
  highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)')
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = highlight
  ctx.fill()
  
  // Side sweep detail
  ctx.strokeStyle = `rgba(${color.r - 15}, ${color.g - 12}, ${color.b - 8}, 0.5)`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.4, top - 10)
  ctx.quadraticCurveTo(cx - w * 0.1, top - 30, cx + w * 0.45, top - 5)
  ctx.stroke()
}

function drawQuiff(ctx, cx, top, w, color) {
  const grad = ctx.createLinearGradient(cx, top - 40, cx, top + 20)
  grad.addColorStop(0, `rgba(${color.r + 20}, ${color.g + 16}, ${color.b + 12}, 0.97)`)
  grad.addColorStop(0.5, `rgba(${color.r + 5}, ${color.g + 4}, ${color.b + 3}, 0.94)`)
  grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.45, top + 5)
  ctx.quadraticCurveTo(cx - w * 0.3, top - 35, cx + w * 0.2, top - 50)
  ctx.quadraticCurveTo(cx + w * 0.6, top - 40, cx + w * 0.5, top + 5)
  ctx.quadraticCurveTo(cx, top + 22, cx - w * 0.45, top + 5)
  ctx.closePath()
  ctx.fill()
  
  // Front volume shine
  const shine = ctx.createRadialGradient(cx + w * 0.1, top - 30, 0, cx + w * 0.1, top - 30, w * 0.35)
  shine.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
  shine.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = shine
  ctx.fill()
}

function drawFade(ctx, cx, top, w, color, faceData) {
  // Top section
  const topGrad = ctx.createRadialGradient(cx, top + 10, 0, cx, top + 10, w * 0.5)
  topGrad.addColorStop(0, `rgba(${color.r + 15}, ${color.g + 12}, ${color.b + 8}, 0.95)`)
  topGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`)
  
  ctx.fillStyle = topGrad
  ctx.beginPath()
  ctx.ellipse(cx, top + 15, w * 0.48, 32, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // Fade gradient on sides
  const fadeLeft = ctx.createLinearGradient(cx - w * 0.55, top, cx - w * 0.25, top)
  fadeLeft.addColorStop(0, `rgba(${color.r + 35}, ${color.g + 28}, ${color.b + 20}, 0.25)`)
  fadeLeft.addColorStop(0.5, `rgba(${color.r + 15}, ${color.g + 12}, ${color.b + 8}, 0.55)`)
  fadeLeft.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.92)`)
  ctx.fillStyle = fadeLeft
  ctx.fillRect(cx - w * 0.55, top - 30, w * 0.3, 60)
  
  const fadeRight = ctx.createLinearGradient(cx + w * 0.25, top, cx + w * 0.55, top)
  fadeRight.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.92)`)
  fadeRight.addColorStop(0.5, `rgba(${color.r + 15}, ${color.g + 12}, ${color.b + 8}, 0.55)`)
  fadeRight.addColorStop(1, `rgba(${color.r + 35}, ${color.g + 28}, ${color.b + 20}, 0.25)`)
  ctx.fillStyle = fadeRight
  ctx.fillRect(cx + w * 0.25, top - 30, w * 0.3, 60)
}

function drawUndercut(ctx, cx, top, w, chinY, color) {
  // Long top section
  const grad = ctx.createLinearGradient(cx, top - 50, cx, top + 20)
  grad.addColorStop(0, `rgba(${color.r + 18}, ${color.g + 14}, ${color.b + 10}, 0.97)`)
  grad.addColorStop(0.5, `rgba(${color.r + 8}, ${color.g + 6}, ${color.b + 4}, 0.94)`)
  grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.5, top + 10)
  ctx.lineTo(cx - w * 0.58, top - 55)
  ctx.quadraticCurveTo(cx, top - 85, cx + w * 0.58, top - 55)
  ctx.lineTo(cx + w * 0.5, top + 10)
  ctx.quadraticCurveTo(cx, top + 25, cx - w * 0.5, top + 10)
  ctx.closePath()
  ctx.fill()
  
  // Shaved sides (lighter/transparent)
  ctx.fillStyle = `rgba(${color.r + 40}, ${color.g + 32}, ${color.b + 24}, 0.2)`
  ctx.fillRect(cx - w * 0.65, top - 25, w * 0.15, 50)
  ctx.fillRect(cx + w * 0.5, top - 25, w * 0.15, 50)
  
  // Texture lines on top
  ctx.strokeStyle = `rgba(${color.r - 12}, ${color.g - 10}, ${color.b - 7}, 0.4)`
  ctx.lineWidth = 1.5
  for (let i = 0; i < 6; i++) {
    ctx.beginPath()
    ctx.moveTo(cx - w * 0.35 + i * w * 0.14, top - 50 + i * 6)
    ctx.quadraticCurveTo(cx + w * 0.05, top - 65 + i * 8, cx + w * 0.38, top - 45 + i * 6)
    ctx.stroke()
  }
}

function drawBob(ctx, cx, top, w, chinY, color) {
  const length = chinY - top + 30
  
  const grad = ctx.createLinearGradient(cx, top - 40, cx, top + length)
  grad.addColorStop(0, `rgba(${color.r + 20}, ${color.g + 16}, ${color.b + 12}, 0.96)`)
  grad.addColorStop(0.3, `rgba(${color.r + 10}, ${color.g + 8}, ${color.b + 6}, 0.94)`)
  grad.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.92)`)
  grad.addColorStop(1, `rgba(${color.r - 8}, ${color.g - 6}, ${color.b - 4}, 0.88)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.6, top - 15)
  ctx.quadraticCurveTo(cx - w * 0.75, top + length * 0.35, cx - w * 0.58, top + length)
  ctx.quadraticCurveTo(cx - w * 0.45, top + length + 12, cx, top + length + 10)
  ctx.quadraticCurveTo(cx + w * 0.45, top + length + 12, cx + w * 0.58, top + length)
  ctx.quadraticCurveTo(cx + w * 0.75, top + length * 0.35, cx + w * 0.6, top - 15)
  ctx.quadraticCurveTo(cx, top - 70, cx - w * 0.6, top - 15)
  ctx.closePath()
  ctx.fill()
  
  // Shine
  const shine = ctx.createLinearGradient(cx - w * 0.3, top, cx + w * 0.3, top + 20)
  shine.addColorStop(0, 'rgba(255, 255, 255, 0)')
  shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)')
  shine.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = shine
  ctx.fill()
}

function drawLongHair(ctx, cx, top, w, chinY, color) {
  const length = (chinY - top) * 2.5
  
  const grad = ctx.createLinearGradient(cx, top - 35, cx, top + length)
  grad.addColorStop(0, `rgba(${color.r + 15}, ${color.g + 12}, ${color.b + 9}, 0.95)`)
  grad.addColorStop(0.2, `rgba(${color.r + 10}, ${color.g + 8}, ${color.b + 6}, 0.93)`)
  grad.addColorStop(0.5, `rgba(${color.r + 5}, ${color.g + 4}, ${color.b + 3}, 0.91)`)
  grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.88)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.55, top - 20)
  
  // Left side with gentle waves
  for (let t = 0; t <= 0.5; t += 0.02) {
    const x = cx - w * 0.55 + (w * 0.2 * t * 2)
    const wave = Math.sin(t * Math.PI * 8) * (12 - t * 15)
    const y = top - 20 + (length * t * 2) + wave
    if (t === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  
  ctx.lineTo(cx - w * 0.52, top + length)
  ctx.quadraticCurveTo(cx, top + length + 18, cx + w * 0.52, top + length)
  
  // Right side with gentle waves
  for (let t = 0.5; t >= 0; t -= 0.02) {
    const x = cx + w * 0.55 - (w * 0.2 * t * 2)
    const wave = Math.sin(t * Math.PI * 8) * (12 - t * 15)
    const y = top - 20 + (length * t * 2) + wave
    ctx.lineTo(x, y)
  }
  
  ctx.quadraticCurveTo(cx, top - 75, cx - w * 0.55, top - 20)
  ctx.closePath()
  ctx.fill()
  
  // Strand highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 2
  for (let i = 0; i < 10; i++) {
    const offset = (i - 5) * w * 0.08
    ctx.beginPath()
    ctx.moveTo(cx + offset, top - 10)
    ctx.quadraticCurveTo(cx + offset * 1.2, top + length * 0.5, cx + offset * 0.9, top + length - 15)
    ctx.stroke()
  }
}

function drawPixie(ctx, cx, top, w, chinY, color) {
  const length = (chinY - top) * 0.55
  
  ctx.fillStyle = `rgba(${color.r + 5}, ${color.g + 4}, ${color.b + 3}, 0.94)`
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.48, top - 8)
  ctx.lineTo(cx - w * 0.62, top + length)
  ctx.quadraticCurveTo(cx - w * 0.32, top + length + 20, cx, top + length + 15)
  ctx.quadraticCurveTo(cx + w * 0.32, top + length + 20, cx + w * 0.62, top + length)
  ctx.lineTo(cx + w * 0.48, top - 8)
  ctx.quadraticCurveTo(cx, top - 68, cx - w * 0.48, top - 8)
  ctx.closePath()
  ctx.fill()
  
  // Pixie texture
  ctx.fillStyle = `rgba(${color.r + 25}, ${color.g + 18}, ${color.b + 12}, 0.25)`
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI
    const r = Math.random() * w * 0.42
    ctx.fillRect(cx + Math.cos(angle) * r, top - 15 + Math.sin(angle) * r * 0.55, 2.5, 3)
  }
}

function drawFringe(ctx, cx, top, w, eyeY, color) {
  ctx.fillStyle = `rgba(${color.r + 8}, ${color.g + 6}, ${color.b + 4}, 0.94)`
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.58, top - 20)
  ctx.quadraticCurveTo(cx, top - 72, cx + w * 0.58, top - 20)
  ctx.lineTo(cx + w * 0.55, eyeY - 5)
  
  // Bangs with slight wave
  for (let i = 8; i >= 0; i--) {
    const t = i / 8
    const x = cx + w * 0.55 - (w * 1.1 * t)
    const wave = Math.sin(t * Math.PI * 6) * 3
    const y = eyeY - 5 - wave
    ctx.lineTo(x, y)
  }
  
  ctx.lineTo(cx - w * 0.58, top - 20)
  ctx.closePath()
  ctx.fill()
  
  // Bang shine
  const shine = ctx.createLinearGradient(cx - w * 0.25, top - 15, cx + w * 0.25, top - 5)
  shine.addColorStop(0, 'rgba(255, 255, 255, 0)')
  shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)')
  shine.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = shine
  ctx.fill()
}

function drawSlickBack(ctx, cx, top, w, color) {
  const grad = ctx.createLinearGradient(cx, top - 35, cx, top + 15)
  grad.addColorStop(0, `rgba(${color.r + 22}, ${color.g + 18}, ${color.b + 14}, 0.96)`)
  grad.addColorStop(0.5, `rgba(${color.r + 12}, ${color.g + 10}, ${color.b + 8}, 0.94)`)
  grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.52, top - 15)
  ctx.quadraticCurveTo(cx - w * 0.38, top - 48, cx, top - 55)
  ctx.quadraticCurveTo(cx + w * 0.38, top - 48, cx + w * 0.52, top - 15)
  ctx.quadraticCurveTo(cx + w * 0.48, top + 8, cx + w * 0.28, top + 18)
  ctx.lineTo(cx - w * 0.28, top + 18)
  ctx.quadraticCurveTo(cx - w * 0.48, top + 8, cx - w * 0.52, top - 15)
  ctx.closePath()
  ctx.fill()
  
  // Slick shine
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.28, top - 28)
  ctx.quadraticCurveTo(cx, top - 38, cx + w * 0.28, top - 28)
  ctx.stroke()
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - w * 0.2, top - 15)
  ctx.quadraticCurveTo(cx + w * 0.12, top - 28, cx + w * 0.38, top - 18)
  ctx.stroke()
}

function drawNaturalHair(ctx, cx, top, w, chinY, color) {
  // Generic natural hair fallback
  const grad = ctx.createRadialGradient(cx, top, 0, cx, top, w * 0.6)
  grad.addColorStop(0, `rgba(${color.r + 15}, ${color.g + 12}, ${color.b + 9}, 0.9)`)
  grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.85)`)
  
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(cx, top + 10, w * 0.5, 35, 0, 0, Math.PI * 2)
  ctx.fill()
}

// Get style template from title and tag
export function getStyleTemplate(title, tag) {
  const t = title.toLowerCase()
  
  if (tag === 'buzz') return 'buzz'
  if (tag === 'fade') return 'fade'
  if (t.includes('pompadour')) return 'pompadour'
  if (t.includes('quiff')) return 'quiff'
  if (t.includes('blowout')) return 'pompadour'
  if (t.includes('undercut')) return 'undercut'
  if (t.includes('bob')) return 'bob'
  if (t.includes('pixie')) return 'pixie'
  if (t.includes('caesar') || t.includes('french') || t.includes('crop') || t.includes('fringe') || t.includes('bangs')) return 'fringe'
  if (t.includes('slick')) return 'slickback'
  if (tag === 'volume') return 'long'
  if (tag === 'combo') return 'undercut'
  if (tag === 'short') return 'buzz'
  
  return 'buzz'
}
