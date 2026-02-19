
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { drawWallpaper, generateLifeWallpaper } from '../lib/generateWallpaper.js'

const PRESETS = [
  { label: 'มือถือ 1080×1920', width:1080, height:1920, cell:10, gap:2 },
  { label: 'Full HD 1920×1080', width:1920, height:1080, cell:12, gap:2 },
  { label: '2K 2560×1440', width:2560, height:1440, cell:14, gap:2 },
  { label: '4K 3840×2160', width:3840, height:2160, cell:16, gap:2 },
]

// ฟอนต์ให้เลือก
const FONT_OPTIONS = [
  { label: 'System UI', value: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif' },
  { label: 'Roboto', value: 'Roboto, system-ui, -apple-system, Segoe UI, Noto Sans Thai, sans-serif' },
  { label: 'Sarabun (TH)', value: 'Sarabun, Noto Sans Thai, system-ui, -apple-system, Segoe UI, sans-serif' },
  { label: 'Noto Sans Thai', value: 'Noto Sans Thai, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
]

// ===== Utilities สำหรับ progress =====
function isoWeekdayIndex(date) { const d = date.getDay(); return (d + 6) % 7 /* จันทร์=0..อาทิตย์=6 */ }
function daysInMonthOf(date) { const y = date.getFullYear(), m = date.getMonth(); return new Date(y, m+1, 0).getDate() }
function isLeapYear(year) { return (year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0) }
function dayOfYearIndex(date) { const start = new Date(date.getFullYear(), 0, 1); return Math.floor((date - start)/(24*60*60*1000)) }

export default function WallpaperMaker(){
  // ===== ขนาดภาพ =====
  const [preset, setPreset] = useState(PRESETS[1])

  // ===== โหมด life vs custom =====
  const [mode, setMode] = useState('life') // 'life' | 'custom'

  // ----- LIFE calendar state -----
  const [years, setYears] = useState(90)
  const [dobStr, setDobStr] = useState('')

  // ----- CUSTOM (progress) state -----
  const [units, setUnits] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(-1)

  // คอลัมน์ (ใช้ได้ทั้งสองโหมด)
  const [cols, setCols] = useState(52)

  // Caption
  const [caption, setCaption] = useState('My Life in Weeks')

  // สี
  const [bg0, setBg0] = useState('#0b0c0f')
  const [bg1, setBg1] = useState('#1a0f2b')
  const [past, setPast] = useState('#5cc8ff')
  const [current, setCurrent] = useState('#f59e0b')
  const [future, setFuture] = useState('rgba(255,255,255,0.16)')

  // cell & dot
  const [cell, setCell] = useState(preset.cell) // px: cell size
  const [dotScalePct, setDotScalePct] = useState(90) // %: ขนาด dot ภายใน cell (เช่น 90% = 0.9)
  const [gap, setGap] = useState(preset.gap)   // px: ระยะห่างระหว่าง cell
  const [radius, setRadius] = useState(3)      // px: ใช้เมื่อ shape = square
  const [shape, setShape] = useState('square') // 'square' | 'circle'

  // ฟอนต์ caption
  const [captionFont, setCaptionFont] = useState(FONT_OPTIONS[0].value)
  const [captionWeight, setCaptionWeight] = useState(700)
  const [captionItalic, setCaptionItalic] = useState(false)

  const canvasRef = useRef(null)

  // ===== Progress Presets =====
  const applyProgressPreset = (type) => {
    const now = new Date()
    if (type === 'none') {
      setMode('life'); setCaption('My Life in Weeks'); setCols(52)
      return
    }
    setMode('custom')

    if (type === 'week') {
      setUnits(7)
      setCurrentIdx(isoWeekdayIndex(now))
      setCols(7) // 1 แถว 7 วัน
      setCaption(`Progress of Week — ${now.toLocaleDateString()}`)
    } else if (type === 'month') {
      const dim = daysInMonthOf(now)
      setUnits(dim)
      setCurrentIdx(now.getDate()-1)
      setCols(7)
      setCaption(`Progress of Month — ${now.toLocaleDateString()}`)
    } else if (type === 'year') {
      const total = isLeapYear(now.getFullYear()) ? 366 : 365
      setUnits(total)
      setCurrentIdx(dayOfYearIndex(now))
      setCols(53)
      setCaption(`Progress of Year — ${now.getFullYear()}`)
    }
  }

  const dotScale = Math.max(30, Math.min(100, parseInt(dotScalePct || '90', 10))) / 100

  // ===== Options ส่งเข้า draw/generate =====
  const opt = useMemo(()=>({
    width: preset.width,
    height: preset.height,

    mode,
    years,
    columns: cols,
    dob: dobStr ? new Date(dobStr + 'T00:00:00') : null,

    units: mode === 'custom' ? units : null,
    currentIndex: mode === 'custom' ? currentIdx : -1,

    bg0, bg1,
    pastColor: past,
    currentColor: current,
    futureColor: future,
    caption,
    cellSize: cell,
    gap,
    radius,
    shape,
    dotScale,          // <— ส่ง dotScale ไปยัง lib
    margin: 40,

    captionFont,
    captionWeight,
    captionItalic,
  }),[
    preset, mode, years, cols, dobStr,
    units, currentIdx,
    bg0,bg1,past,current,future,caption,cell,gap,radius,shape,
    dotScale, captionFont, captionWeight, captionItalic
  ])

  // ===== Render Preview =====
  useEffect(()=>{
    const canvas = canvasRef.current
    canvas.width = preset.width
    canvas.height = preset.height
    const ctx = canvas.getContext('2d')
    drawWallpaper(ctx, opt)
  },[opt, preset])

  // ===== Download =====
  const download = async (scale=1) => {
    const { blob } = await generateLifeWallpaper({ ...opt, scale })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `life-wallpaper-${opt.width}x${opt.height}${scale>1?`@${scale}x`:''}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columnsLabel = (mode === 'custom') ? 'แถวละกี่วัน (columns)' : 'แถวละกี่สัปดาห์ (columns)'
  const cellSizeLabel = (shape === 'circle') ? 'ขนาดวงกลม (px) — เส้นผ่านศูนย์กลาง' : 'ขนาดช่อง (px)'

  return (
    <section id="wallpaper" className="wallpaper">
      <div className="container">
        <h2>Wallpaper Generator — Gap & Dot Size</h2>
        <p className="muted">
          ปรับ <strong>แถวละกี่วัน/สัปดาห์</strong>, <strong>ระยะห่างระหว่างจุด (gap)</strong> และ <strong>ขนาด dot ภายใน cell</strong> ได้อย่างอิสระ
        </p>

        <div className="wp-grid">
          <div className="controls">
            {/* Preset ขนาดภาพ */}
            <label>พรีเซ็ตขนาด
              <select value={preset.label} onChange={e=>{
                const p = PRESETS.find(x=>x.label===e.target.value)
                setPreset(p); setCell(p.cell); setGap(p.gap)
              }}>
                {PRESETS.map(p=> <option key={p.label} value={p.label}>{p.label}</option>)}
              </select>
            </label>

            {/* พรีเซ็ต Progress */}
            <div className="row-3">
              <button className="btn" onClick={()=>applyProgressPreset('week')}>Progress of Week</button>
              <button className="btn" onClick={()=>applyProgressPreset('month')}>Progress of Month</button>
              <button className="btn" onClick={()=>applyProgressPreset('year')}>Progress of Year</button>
            </div>
            <div className="row">
              <button className="btn" onClick={()=>applyProgressPreset('none')}>กลับโหมด Life Calendar (None)</button>
            </div>

            {/* โหมด Life */}
            {mode === 'life' && (
              <div className="row-2">
                <label>ปีเป้าหมาย
                  <input type="number" min="50" max="120" value={years} onChange={e=>setYears(Math.max(50, Math.min(120, parseInt(e.target.value||'90',10))))} />
                </label>
                <label>วันเกิด (คำนวณสัปดาห์ปัจจุบัน)
                  <input type="date" value={dobStr} onChange={e=>setDobStr(e.target.value)} />
                </label>
              </div>
            )}

            {/* โหมด Progress */}
            {mode === 'custom' && (
              <div className="row-2">
                <label>จำนวนช่องรวม (units)
                  <input type="number" min="1" max="10000" value={units ?? 0} onChange={e=>setUnits(Math.max(1, Math.min(10000, parseInt(e.target.value||'1',10))))} />
                </label>
                <label>ตำแหน่งวันนี้ (current index)
                  <input type="number" min="-1" max={(units??1)-1} value={currentIdx} onChange={e=>setCurrentIdx(Math.max(-1, Math.min((units??1)-1, parseInt(e.target.value||'-1',10))))} />
                </label>
              </div>
            )}

            {/* ใช้ได้ทั้งสองโหมด */}
            <label>{columnsLabel}
              <input type="number" min="1" max="400" value={cols} onChange={e=>setCols(Math.max(1, Math.min(400, parseInt(e.target.value||'52',10))))} />
            </label>

            {/* Caption */}
            <label>คำบรรยาย (caption)
              <input type="text" value={caption} onChange={e=>setCaption(e.target.value)} placeholder="เช่น My Life in Weeks" />
            </label>

            {/* ฟอนต์ caption */}
            <label>ฟอนต์ Caption
              <select value={captionFont} onChange={e=>setCaptionFont(e.target.value)}>
                {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
            </label>
            <div className="row-3">
              <label>น้ำหนัก (100–900)
                <input type="number" min="100" max="900" step="100" value={captionWeight} onChange={e=>setCaptionWeight(Math.max(100, Math.min(900, parseInt(e.target.value||'700',10))))} />
              </label>
              <label>ตัวเอียง
                <select value={captionItalic ? '1' : '0'} onChange={e=>setCaptionItalic(e.target.value === '1')}>
                  <option value="0">ปกติ</option>
                  <option value="1">Italic</option>
                </select>
              </label>
            </div>

            {/* สีและรูปร่าง */}
            <div className="row-3">
              <label>สีพื้นหลัง A <input type="color" value={bg0} onChange={e=>setBg0(e.target.value)} /></label>
              <label>สีพื้นหลัง B <input type="color" value={bg1} onChange={e=>setBg1(e.target.value)} /></label>
              <label>อนาคต <input type="color" value={future.startsWith('rgba')?'#222222':future} onChange={e=>setFuture(e.target.value)} /></label>
            </div>
            <div className="row-3">
              <label>อดีต <input type="color" value={past} onChange={e=>setPast(e.target.value)} /></label>
              <label>ปัจจุบัน <input type="color" value={current} onChange={e=>setCurrent(e.target.value)} /></label>
              <label>รูปร่าง
                <select value={shape} onChange={e=>setShape(e.target.value)}>
                  <option value="square">Square</option>
                  <option value="circle">Circle</option>
                </select>
              </label>
            </div>

            {/* ขนาด cell/วงกลม + dot scale + gap + radius */}
            <div className="row-3">
              <label>{cellSizeLabel}
                <input
                  type="number" min="6" max="64"
                  value={cell}
                  onChange={e=>setCell(Math.max(6, Math.min(64, parseInt(e.target.value||'14',10))))}
                />
              </label>

              <label>ขนาด dot ภายใน cell (%)
                <input
                  type="number" min="30" max="100"
                  value={dotScalePct}
                  onChange={e=>setDotScalePct(Math.max(30, Math.min(100, parseInt(e.target.value||'90',10))))}
                />
              </label>

              <label>ระยะห่างระหว่าง cell (gap px)
                <input
                  type="number" min="0" max="24"
                  value={gap}
                  onChange={e=>setGap(Math.max(0, Math.min(24, parseInt(e.target.value||'2',10))))}
                />
              </label>
            </div>

            {shape === 'square' && (
              <div className="row">
                <label style={{width:'100%'}}>มุมโค้ง (square เท่านั้น)
                  <input
                    type="number" min="0" max="24" style={{width:'100%'}}
                    value={radius}
                    onChange={e=>setRadius(Math.max(0, Math.min(24, parseInt(e.target.value||'3',10))))}
                  />
                </label>
              </div>
            )}

            <div className="row" style={{gap:8}}>
              <button className="btn" onClick={()=>download(1)}>ดาวน์โหลด PNG</button>
              <button className="btn primary" onClick={()=>download(2)}>ดาวน์โหลด PNG @2x</button>
            </div>
          </div>

          <div className="preview">
            <canvas ref={canvasRef} style={{width:'100%', height:'auto', borderRadius:12, border:'1px solid rgba(255,255,255,.12)'}}/>
          </div>
        </div>
      </div>
    </section>
  )
}
