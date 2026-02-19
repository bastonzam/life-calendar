
/**
 * generateLifeWallpaper(options): Promise<{ blob: Blob, dataUrl: string }>
 * สร้างภาพกริด Life Calendar / Custom Progress ลง Canvas และคืน Blob/DataURL สำหรับดาวน์โหลด
 * โค้ดนี้เป็นงานเขียนใหม่ ไม่คัดลอกจากแหล่งอื่น
 */

export function generateLifeWallpaper(options = {}) {
  const opt = normalizeOptions(options)
  const { width, height, scale } = opt

  // รองรับฟอนต์เว็บ: รอฟอนต์โหลด (ถ้ามี)
  const ensureFonts = ('fonts' in document && document.fonts && document.fonts.ready)
    ? document.fonts.ready.catch(() => {})
    : Promise.resolve()

  return ensureFonts.then(() => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    ctx.scale(scale, scale)

    drawWallpaper(ctx, opt)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const dataUrl = canvas.toDataURL('image/png')
        resolve({ blob, dataUrl })
      }, 'image/png')
    })
  })
}

export function drawWallpaper(ctx, opt){
  const {
    width:w, height:h,
    bg0, bg1,
    pastColor, currentColor, futureColor,

    // โหมด life-calendar vs custom-units
    mode, years, columns, dob,
    units, currentIndex,

    // รูปร่างและสไตล์
    cellSize, gap, radius, shape,
    dotScale,            // <— ใหม่: สัดส่วนจุดภายใน cell (0.3–1.0)
    margin,

    // Caption
    caption, captionColor, captionWeight, captionItalic, captionFont,
    
    // Progress Display
    customText, showPercent,
  } = opt

  // พื้นหลัง gradient
  const g = ctx.createLinearGradient(0,0,w,h)
  g.addColorStop(0, bg0)
  g.addColorStop(1, bg1)
  ctx.fillStyle = g
  ctx.fillRect(0,0,w,h)

  // ===== คำนวณจำนวนช่องรวม + current index =====
  let total = 0
  let cur = -1

  if (mode === 'custom' && Number.isInteger(units) && units > 0) {
    total = units
    cur = (Number.isInteger(currentIndex) ? clamp(currentIndex, -1, total-1) : -1)
  } else {
    total = years * 52
    if (dob instanceof Date && !isNaN(dob)) {
      const now = new Date()
      const weeks = Math.floor((now - dob) / (7*24*60*60*1000))
      cur = clamp(weeks, -1, total-1)
    }
  }

  // ===== วาดกริด =====
  const cols = columns
  const rows = Math.ceil(total / cols)
  const gridW = cols * cellSize + (cols-1) * gap
  const gridH = rows * cellSize + (rows-1) * gap
  const startX = Math.round(margin + (w - margin*2 - gridW)/2)
  const startY = Math.round(margin + (h - margin*2 - gridH)/2)

  ctx.save()
  for(let i=0; i<total; i++){
    const r = Math.floor(i/cols)
    const c = i % cols
    const cellX = startX + c*(cellSize+gap)
    const cellY = startY + r*(cellSize+gap)

    let color = futureColor
    if (cur >= 0) {
      if (i < cur) color = pastColor
      else if (i === cur) color = currentColor
    }

    // ขนาด “จุด” จริงภายในเซลล์ (เล็กกว่าหรือเท่ากับ cellSize)
    const inner = Math.max(1, Math.round(cellSize * dotScale))
    const offset = Math.round((cellSize - inner) / 2) // จัดให้อยู่กลางเซลล์

    ctx.fillStyle = color
    if (shape === 'circle') {
      const rad = inner / 2
      const cx = cellX + offset + rad
      const cy = cellY + offset + rad
      ctx.beginPath()
      ctx.arc(cx, cy, rad, 0, Math.PI*2)
      ctx.fill()
    } else {
      const innerRadius = Math.min(radius, inner/2)
      roundedRect(ctx, cellX + offset, cellY + offset, inner, inner, innerRadius)
      ctx.fill()
    }
  }
  ctx.restore()

  // ===== Progress Percentage (ด้านล่างขวา) =====
  if (showPercent && cur >= 0 && total > 0) {
    // cur เป็น 0-indexed ดังนั้นต้อง +1 เพื่อนับจำนวนที่ active จริง
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

  // ===== Caption =====
  if (caption) {
    ctx.fillStyle = captionColor
    ctx.textAlign = 'center'
    const fontSize = Math.max(18, Math.round(w * 0.03))
    const italic = captionItalic ? 'italic' : 'normal'
    ctx.font = `${italic} ${captionWeight} ${fontSize}px ${captionFont}`
    const y = Math.min(h - 40, startY + gridH + Math.max(32, Math.round(h*0.05)))
    ctx.fillText(caption, w/2, y)
  }
}

function roundedRect(ctx, x, y, w, h, r){
  const rx = Math.min(r, Math.min(w,h)/2)
  ctx.beginPath()
  ctx.moveTo(x+rx, y)
  ctx.lineTo(x+w-rx, y)
  ctx.quadraticCurveTo(x+w, y, x+w, y+rx)
  ctx.lineTo(x+w, y+h-rx)
  ctx.quadraticCurveTo(x+w, y+h, x+w-rx, y+h)
  ctx.lineTo(x+rx, y+h)
  ctx.quadraticCurveTo(x, y+h, x, y+h-rx)
  ctx.lineTo(x, y+rx)
  ctx.quadraticCurveTo(x, y, x+rx, y)
}

function normalizeOptions(o){
  const d = {
    // ขนาดภาพ
    width: 1920,
    height: 1080,
    scale: 1,

    // โหมด
    mode: 'life',        // 'life' | 'custom'
    years: 90,
    columns: 52,
    dob: null,

    // custom units
    units: null,
    currentIndex: -1,

    // รูปร่างและสไตล์
    cellSize: 14,
    gap: 2,
    radius: 3,
    shape: 'square',     // 'square' | 'circle'
    dotScale: 1.0,       // <— ใหม่: 0.3..1.0 (สเกลจุดภายใน cell)
    margin: 40,

    // สี
    bg0: '#0b0c0f',
    bg1: '#1a0f2b',
    pastColor: '#5cc8ff',
    currentColor: '#f59e0b',
    futureColor: 'rgba(255,255,255,0.16)',

    // Caption
    caption: 'My Life in Weeks',
    captionColor: 'rgba(255,255,255,0.92)',
    captionWeight: 600,
    captionItalic: false,
    captionFont: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif',
    
    // Progress Display
    customText: 'active',
    showPercent: true,
  }

  const out = { ...d, ...o }

  // sanitize เบื้องต้น
  out.width = clamp(int(out.width), 320, 8192)
  out.height = clamp(int(out.height), 320, 8192)
  out.scale = clamp(Number(out.scale)||1, 1, 4)
  out.years = clamp(int(out.years), 50, 120)
  out.columns = clamp(int(out.columns), 1, 400)
  out.cellSize = clamp(int(out.cellSize), 6, 64)
  out.gap = clamp(int(out.gap), 0, 24)
  out.radius = clamp(int(out.radius), 0, 24)
  out.dotScale = clamp(Number(out.dotScale)||1, 0.3, 1.0)
  out.margin = clamp(int(out.margin), 0, 300)
  out.shape = out.shape === 'circle' ? 'circle' : 'square'
  const w = int(out.captionWeight)
  out.captionWeight = (w >= 100 && w <= 900) ? w : 600

  if (out.dob && !(out.dob instanceof Date)) {
    const dt = new Date(String(out.dob))
    out.dob = isNaN(dt) ? null : dt
  }

  if (out.mode === 'custom') {
    out.units = Number.isFinite(out.units) ? int(out.units) : null
    out.currentIndex = Number.isFinite(out.currentIndex) ? int(out.currentIndex) : -1
  } else {
    out.units = null
    out.currentIndex = -1
  }

  return out
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)) }
function int(v){ return parseInt(v, 10) || 0 }
