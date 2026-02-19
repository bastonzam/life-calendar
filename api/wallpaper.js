import { createCanvas } from '@napi-rs/canvas'

// ===== Drawing Logic (ported from src/lib/generateWallpaper.js) =====

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function int(v) { return parseInt(v, 10) || 0 }

function roundedRect(ctx, x, y, w, h, r) {
  const rx = Math.min(r, Math.min(w, h) / 2)
  ctx.beginPath()
  ctx.moveTo(x + rx, y)
  ctx.lineTo(x + w - rx, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rx)
  ctx.lineTo(x + w, y + h - rx)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h)
  ctx.lineTo(x + rx, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rx)
  ctx.lineTo(x, y + rx)
  ctx.quadraticCurveTo(x, y, x + rx, y)
}

function normalizeOptions(o) {
  const d = {
    width: 1179, height: 2556, scale: 1,
    mode: 'custom', years: 90, columns: 15, dob: null,
    units: null, currentIndex: -1,
    cellSize: 50, gap: 2, radius: 3, shape: 'circle', dotScale: 0.9, margin: 40,
    bg0: '#0b0c0f', bg1: '#1a0f2b',
    pastColor: '#5cc8ff', currentColor: '#f59e0b', futureColor: 'rgba(255,255,255,0.16)',
    caption: '', captionColor: 'rgba(255,255,255,0.92)',
    captionWeight: 700, captionItalic: false,
    captionFont: 'sans-serif',
    customText: 'active', showPercent: true,
  }
  const out = { ...d, ...o }
  out.width = clamp(int(out.width), 320, 8192)
  out.height = clamp(int(out.height), 320, 8192)
  out.scale = clamp(Number(out.scale) || 1, 1, 4)
  out.years = clamp(int(out.years), 50, 120)
  out.columns = clamp(int(out.columns), 1, 400)
  out.cellSize = clamp(int(out.cellSize), 6, 64)
  out.gap = clamp(int(out.gap), 0, 24)
  out.radius = clamp(int(out.radius), 0, 24)
  out.dotScale = clamp(Number(out.dotScale) || 1, 0.3, 1.0)
  out.margin = clamp(int(out.margin), 0, 300)
  out.shape = out.shape === 'circle' ? 'circle' : 'square'
  if (out.mode === 'custom') {
    out.units = Number.isFinite(out.units) ? int(out.units) : null
    out.currentIndex = Number.isFinite(out.currentIndex) ? int(out.currentIndex) : -1
  }
  return out
}

function drawWallpaper(ctx, opt) {
  const {
    width: w, height: h,
    bg0, bg1,
    pastColor, currentColor, futureColor,
    mode, years, columns, dob,
    units, currentIndex,
    cellSize, gap, radius, shape, dotScale, margin,
    caption, captionColor, captionWeight, captionItalic, captionFont,
    customText, showPercent,
  } = opt

  // gradient background
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, bg0)
  g.addColorStop(1, bg1)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // resolve total & current index
  let total = 0, cur = -1
  if (mode === 'custom' && Number.isInteger(units) && units > 0) {
    total = units
    cur = Number.isInteger(currentIndex) ? clamp(currentIndex, -1, total - 1) : -1
  } else {
    total = years * 52
    if (dob instanceof Date && !isNaN(dob)) {
      const now = new Date()
      const weeks = Math.floor((now - dob) / (7 * 24 * 60 * 60 * 1000))
      cur = clamp(weeks, -1, total - 1)
    }
  }

  // draw grid
  const cols = columns
  const rows = Math.ceil(total / cols)
  const gridW = cols * cellSize + (cols - 1) * gap
  const gridH = rows * cellSize + (rows - 1) * gap
  const startX = Math.round(margin + (w - margin * 2 - gridW) / 2)
  const startY = Math.round(margin + (h - margin * 2 - gridH) / 2)

  ctx.save()
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const cellX = startX + c * (cellSize + gap)
    const cellY = startY + r * (cellSize + gap)

    let color = futureColor
    if (cur >= 0) {
      if (i < cur) color = pastColor
      else if (i === cur) color = currentColor
    }

    const inner = Math.max(1, Math.round(cellSize * dotScale))
    const offset = Math.round((cellSize - inner) / 2)

    ctx.fillStyle = color
    if (shape === 'circle') {
      const rad = inner / 2
      const cx = cellX + offset + rad
      const cy = cellY + offset + rad
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, Math.PI * 2)
      ctx.fill()
    } else {
      const innerRadius = Math.min(radius, inner / 2)
      roundedRect(ctx, cellX + offset, cellY + offset, inner, inner, innerRadius)
      ctx.fill()
    }
  }
  ctx.restore()

  // progress percentage (bottom right)
  if (showPercent && cur >= 0 && total > 0) {
    const percent = Math.round(((cur + 1) / total) * 100)
    const displayText = customText ? `${customText} ${percent}%` : `${percent}%`
    ctx.fillStyle = captionColor
    ctx.textAlign = 'right'
    const percentFontSize = Math.max(14, Math.round(w * 0.02))
    const italic = captionItalic ? 'italic' : 'normal'
    ctx.font = `${italic} ${captionWeight} ${percentFontSize}px ${captionFont}`
    const percentX = startX + gridW
    const percentY = startY + gridH + Math.max(24, Math.round(h * 0.03))
    ctx.fillText(displayText, percentX, percentY)
  }

  // caption
  if (caption) {
    ctx.fillStyle = captionColor
    ctx.textAlign = 'center'
    const fontSize = Math.max(18, Math.round(w * 0.03))
    const italic = captionItalic ? 'italic' : 'normal'
    ctx.font = `${italic} ${captionWeight} ${fontSize}px ${captionFont}`
    const y = Math.min(h - 40, startY + gridH + Math.max(32, Math.round(h * 0.05)))
    ctx.fillText(caption, w / 2, y)
  }
}

// ===== Vercel API Handler =====

export default function handler(req, res) {
  try {
    const urlStr = req.url || ''
    const qIdx = urlStr.indexOf('?')
    const params = new URLSearchParams(qIdx >= 0 ? urlStr.slice(qIdx + 1) : '')

    const width = parseInt(params.get('width') || '1179', 10)
    const height = parseInt(params.get('height') || '2556', 10)
    const style = params.get('style') || 'days'

    const cellSize = parseInt(params.get('cellSize') || '50', 10)
    const gap = parseInt(params.get('gap') || '2', 10)
    const radius = parseInt(params.get('radius') || '3', 10)
    const dotScale = parseFloat(params.get('dotScale') || '0.9')
    const shape = params.get('shape') || 'circle'

    let defaultCols = 15
    if (style === 'weeks') defaultCols = 52
    else if (style === 'months') defaultCols = 4
    const cols = parseInt(params.get('columns') || String(defaultCols), 10)

    const bg0 = params.get('bg0') || '#0b0c0f'
    const bg1 = params.get('bg1') || '#1a0f2b'
    const pastColor = params.get('past') || '#5cc8ff'
    const currentColor = params.get('current') || '#f59e0b'
    const futureColor = params.get('future') || '#ffffff'
    const futureOpacity = parseInt(params.get('futureOpacity') || '16', 10)

    const customText = params.get('customText') || 'active'
    const showPercent = params.get('showPercent') === '1'

    const futureColorRgba = `rgba(${parseInt(futureColor.slice(1, 3), 16)}, ${parseInt(futureColor.slice(3, 5), 16)}, ${parseInt(futureColor.slice(5, 7), 16)}, ${(futureOpacity / 100).toFixed(2)})`

    const now = new Date()
    let units, currentIndex, caption

    if (style === 'days') {
      const isLeap = (now.getFullYear() % 4 === 0) && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)
      units = isLeap ? 366 : 365
      const start = new Date(now.getFullYear(), 0, 1)
      currentIndex = Math.floor((now - start) / (24 * 60 * 60 * 1000))
      caption = `Progress of Year — ${now.getFullYear()}`
    } else if (style === 'weeks') {
      units = 52
      caption = `Progress of Year - 52 Weeks`
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
      currentIndex = Math.floor(dayOfYear / 7)
    } else {
      units = 12
      currentIndex = now.getMonth()
      caption = `Year Progress - 12 Months`
    }

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const opt = normalizeOptions({
      width, height, scale: 1,
      mode: 'custom',
      units, currentIndex,
      columns: cols, caption,
      bg0, bg1,
      pastColor, currentColor,
      futureColor: futureColorRgba,
      cellSize, gap, radius, shape, dotScale,
      margin: 40,
      captionFont: 'sans-serif',
      captionWeight: 700,
      captionItalic: false,
      customText, showPercent,
    })

    drawWallpaper(ctx, opt)

    const buffer = canvas.toBuffer('image/png')

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    res.status(200).send(buffer)
  } catch (err) {
    console.error('Wallpaper API error:', err)
    res.status(500).json({ error: err.message })
  }
}
