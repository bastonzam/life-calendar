import React, { useState, useMemo, useEffect, useRef } from 'react'
import { drawWallpaper } from '../lib/generateWallpaper.js'

// Device Groups
const DEVICE_GROUPS = [
  {
    group: 'Apple iPhone',
    models: [
      { label: 'iPhone 16 Pro Max', width: 1320, height: 2868 },
      { label: 'iPhone 16 Pro', width: 1206, height: 2622 },
      { label: 'iPhone 16 Plus / 15 Plus / 15 Pro Max / 16 Pro Max (alt)', width: 1290, height: 2796 },
      { label: 'iPhone 16 / 15 / 15 Pro', width: 1179, height: 2556 },
      { label: 'iPhone 14 Pro Max / 13 Pro Max / 12 Pro Max', width: 1284, height: 2778 },
      { label: 'iPhone 14 Pro / 13 Pro / 13 / 12 Pro / 14', width: 1170, height: 2532 },
      { label: 'iPhone 13 mini / 12 mini', width: 1080, height: 2340 },
      { label: 'iPhone SE (2nd/3rd gen)', width: 750, height: 1334 },
      { label: 'iPhone 11 Pro / XS / X', width: 1125, height: 2436 },
      { label: 'iPhone 11 Pro Max / XS Max', width: 1242, height: 2688 },
      { label: 'iPhone 11 / XR', width: 828, height: 1792 },
    ],
  },
  {
    group: 'Samsung Galaxy S',
    models: [
      { label: 'Galaxy S25 Ultra', width: 1440, height: 3120 },
      { label: 'Galaxy S25+ / S24+', width: 1080, height: 2340 },
      { label: 'Galaxy S25 / S24 / S23', width: 1080, height: 2340 },
      { label: 'Galaxy S24 Ultra / S23 Ultra', width: 1440, height: 3088 },
      { label: 'Galaxy S22 Ultra', width: 1080, height: 2340 },
      { label: 'Galaxy S22+ / S21+', width: 1080, height: 2400 },
      { label: 'Galaxy S22 / S21 / S20', width: 1080, height: 2400 },
    ],
  },
  {
    group: 'Samsung Galaxy A',
    models: [
      { label: 'Galaxy A55 / A54 / A53', width: 1080, height: 2340 },
      { label: 'Galaxy A35 / A34', width: 1080, height: 2340 },
      { label: 'Galaxy A15 / A14', width: 1080, height: 2340 },
    ],
  },
  {
    group: 'Google Pixel',
    models: [
      { label: 'Pixel 9 Pro XL / 8 Pro', width: 1344, height: 2992 },
      { label: 'Pixel 9 Pro / 9 / 8', width: 1080, height: 2400 },
      { label: 'Pixel 9 Pro Fold', width: 1080, height: 2424 },
      { label: 'Pixel 7 Pro / 6 Pro', width: 1440, height: 3120 },
      { label: 'Pixel 7 / 6', width: 1080, height: 2400 },
    ],
  },
  {
    group: 'Xiaomi',
    models: [
      { label: 'Xiaomi 15 Ultra / 14 Ultra', width: 1440, height: 3200 },
      { label: 'Xiaomi 15 / 14', width: 1080, height: 2400 },
      { label: 'Redmi Note 13 / 12 Pro', width: 1080, height: 2400 },
      { label: 'Redmi 13C / 12C', width: 720, height: 1600 },
    ],
  },
  {
    group: 'OnePlus',
    models: [
      { label: 'OnePlus 13 / 12', width: 1440, height: 3168 },
      { label: 'OnePlus 13R / 12R', width: 1080, height: 2392 },
      { label: 'OnePlus Nord 4 / CE 4', width: 1080, height: 2412 },
    ],
  },
]

// Flat list สำหรับ search
const ALL_DEVICES = DEVICE_GROUPS.flatMap(g => g.models)

// Layout Styles
const LAYOUT_STYLES = [
  { value: 'days', label: 'Days (all days of the year)', units: 365, cols: 53, caption: 'Progress of Year' },
  { value: 'weeks', label: 'Weeks (52 weeks of the year)', units: 52, cols: 52, caption: 'Progress of Year - 52 Weeks' },
  { value: 'months', label: 'Months (12 months)', units: 12, cols: 12, caption: 'Year Progress - 12 Months' },
]

export default function AutomationGuide() {
  const [layoutStyle, setLayoutStyle] = useState(LAYOUT_STYLES[0])
  const [iphoneModel, setIphoneModel] = useState(DEVICE_GROUPS[0].models[0])
  const [detectedDevice, setDetectedDevice] = useState(null)
  
  // Customization states
  const [cellSize, setCellSize] = useState(50)
  const [gap, setGap] = useState(2)
  const [radius, setRadius] = useState(3)
  const [dotScale, setDotScale] = useState(90)
  const [shape, setShape] = useState('circle')
  const [columns, setColumns] = useState(0) // จำนวนช่องในแต่ละแถว
  
  // Colors
  const [bg0, setBg0] = useState('#0b0c0f')
  const [bg1, setBg1] = useState('#1a0f2b')
  const [pastColor, setPastColor] = useState('#5cc8ff')
  const [currentColor, setCurrentColor] = useState('#f59e0b')
  const [futureColor, setFutureColor] = useState('#ffffff')
  const [futureOpacity, setFutureOpacity] = useState(16)
  
  // Progress Text
  const [customText, setCustomText] = useState('active')
  const [showPercent, setShowPercent] = useState(true)
  
  const canvasRef = useRef(null)

  // อัปเดต columns เมื่อเปลี่ยน layoutStyle
  useEffect(() => {
    if (layoutStyle.value === 'days') setColumns(15)
    else if (layoutStyle.value === 'weeks') setColumns(52)
    else if (layoutStyle.value === 'months') setColumns(4)
  }, [layoutStyle])

  // สร้าง URL สำหรับ wallpaper — ชี้ไปที่ /api/wallpaper ซึ่ง return PNG โดยตรง
  // (ทำให้ iOS Shortcuts "Get Contents of URL" ได้รูปภาพ ไม่ใช่ HTML page)
  const wallpaperUrl = useMemo(() => {
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      height: iphoneModel.height,
      width: iphoneModel.width,
      style: layoutStyle.value,
      cellSize: cellSize,
      gap: gap,
      radius: radius,
      dotScale: (dotScale / 100).toFixed(2),
      shape: shape,
      columns: columns,
      bg0: bg0,
      bg1: bg1,
      past: pastColor,
      current: currentColor,
      future: futureColor,
      futureOpacity: futureOpacity,
      customText: customText,
      showPercent: showPercent ? '1' : '0',
    })
    
    return `${baseUrl}/api/wallpaper?${params.toString()}`
  }, [layoutStyle, iphoneModel, cellSize, gap, radius, dotScale, shape, columns, bg0, bg1, pastColor, currentColor, futureColor, futureOpacity, customText, showPercent])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wallpaperUrl)
      // .then(() => alert('URL copied to clipboard! 📋'))
      .catch(err => console.error('Failed to copy:', err))
  }

  const detectScreenSize = () => {
    const dpr = window.devicePixelRatio || 1
    const pw = Math.round(screen.width * dpr)
    const ph = Math.round(screen.height * dpr)
    // ensure portrait (width < height)
    const detW = Math.min(pw, ph)
    const detH = Math.max(pw, ph)

    // หา match ใน ALL_DEVICES
    const match = ALL_DEVICES.find(m => m.width === detW && m.height === detH)
    if (match) {
      setIphoneModel(match)
      setDetectedDevice({ width: detW, height: detH, matched: match.label })
    } else {
      // ใช้ขนาดที่ detect ได้เป็น custom model
      const custom = { label: `This Device (${detW}×${detH})`, width: detW, height: detH }
      setIphoneModel(custom)
      setDetectedDevice({ width: detW, height: detH, matched: null })
    }
  }

  // Preview rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const previewWidth = 400
    const previewHeight = Math.round((iphoneModel.height / iphoneModel.width) * previewWidth)
    
    canvas.width = previewWidth
    canvas.height = previewHeight
    const ctx = canvas.getContext('2d')
    
    const scaleRatio = previewWidth / iphoneModel.width
    ctx.scale(scaleRatio, scaleRatio)
    
    const now = new Date()
    let units, currentIdx, caption
    
    if (layoutStyle.value === 'days') {
      const isLeap = (now.getFullYear() % 4 === 0) && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)
      units = isLeap ? 366 : 365
      const start = new Date(now.getFullYear(), 0, 1)
      currentIdx = Math.floor((now - start) / (24 * 60 * 60 * 1000))
      caption = `Progress of Year — ${now.getFullYear()}`
    } else if (layoutStyle.value === 'weeks') {
      units = 52
      caption = `Progress of Year - 52 Weeks`
      
      // คำนวณสัปดาห์ที่เท่าไหร่ของปีนี้ (0-51)
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
      currentIdx = Math.floor(dayOfYear / 7)
    } else {
      units = 12
      currentIdx = now.getMonth()
      caption = `Year Progress - 12 Months`
    }

    const futureColorRgba = `rgba(${parseInt(futureColor.slice(1,3), 16)}, ${parseInt(futureColor.slice(3,5), 16)}, ${parseInt(futureColor.slice(5,7), 16)}, ${(futureOpacity / 100).toFixed(2)})`

    drawWallpaper(ctx, {
      width: iphoneModel.width,
      height: iphoneModel.height,
      mode: 'custom',
      units,
      currentIndex: currentIdx,
      columns: columns,
      caption,
      bg0,
      bg1,
      pastColor,
      currentColor,
      futureColor: futureColorRgba,
      cellSize,
      gap,
      radius,
      shape,
      dotScale: dotScale / 100,
      margin: 40,
      captionFont: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif',
      captionWeight: 700,
      captionItalic: false,
      customText,
      showPercent,
    })
  }, [layoutStyle, iphoneModel, cellSize, gap, radius, dotScale, shape, columns, bg0, bg1, pastColor, currentColor, futureColor, futureOpacity, customText, showPercent])

  return (
    <section className="automation-guide">
      <div className="container">
        <h2>Automated Wallpaper Setup</h2>
        <p className="muted">
          สร้างวอลเปเปอร์ที่อัปเดตอัตโนมัติทุกวันบน iPhone และ Android ของคุณ
        </p>

        <div className="steps-container">
          {/* Step 1: Define & Customize your Wallpaper */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">1</span>
              <h3>Define & Customize your Wallpaper</h3>
            </div>
            
            <div className="step-content-grid">
              {/* Left: Controls */}
              <div className="controls-section">
                <div className="control-group">
                  <h4 className="group-title">Basic Settings</h4>
                  
                  <label className="form-label">
                    <span className="label-text">Layout Style</span>
                    <select 
                      className="select-input"
                      value={layoutStyle.value} 
                      onChange={e => setLayoutStyle(LAYOUT_STYLES.find(s => s.value === e.target.value))}
                    >
                      {LAYOUT_STYLES.map(style => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-label">
                    <span className="label-text">Device</span>
                    <select 
                      className="select-input"
                      value={iphoneModel.label} 
                      onChange={e => {
                        const found = ALL_DEVICES.find(m => m.label === e.target.value)
                        if (found) { setIphoneModel(found); setDetectedDevice(null) }
                      }}
                    >
                      {/* ถ้า detect ได้ custom model ที่ไม่มีในลิสต์ ให้แสดงเป็น option */}
                      {detectedDevice && !ALL_DEVICES.find(m => m.width === detectedDevice.width && m.height === detectedDevice.height) && (
                        <optgroup label="Detected">
                          <option value={iphoneModel.label}>{iphoneModel.label}</option>
                        </optgroup>
                      )}
                      {DEVICE_GROUPS.map(group => (
                        <optgroup key={group.group} label={group.group}>
                          {group.models.map(model => (
                            <option key={model.label} value={model.label}>
                              {model.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>

                  <button className="detect-btn" onClick={detectScreenSize}>
                    📱 Use This Device
                  </button>

                  {detectedDevice && (
                    <div className={`info-badge ${detectedDevice.matched ? 'badge-success' : 'badge-custom'}`}>
                      {detectedDevice.matched
                        ? `✓ Matched: ${detectedDevice.matched}`
                        : `✓ Custom: ${detectedDevice.width}×${detectedDevice.height}`}
                    </div>
                  )}

                  <div className="info-badge">
                    Resolution: {iphoneModel.width} × {iphoneModel.height}
                  </div>
                </div>

                <div className="control-group">
                  <h4 className="group-title">Dot Style</h4>
                  
                  <label className="slider-label">
                    <div className="slider-header">
                      <span className="slider-text">Cell Size</span>
                      <span className="slider-value">{cellSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      className="slider"
                      min="6" 
                      max="64" 
                      step="1"
                      value={cellSize}
                      onChange={e => setCellSize(parseInt(e.target.value))}
                    />
                  </label>

                  <label className="slider-label">
                    <div className="slider-header">
                      <span className="slider-text">Dot Size</span>
                      <span className="slider-value">{dotScale}%</span>
                    </div>
                    <input 
                      type="range" 
                      className="slider"
                      min="30" 
                      max="100" 
                      step="1"
                      value={dotScale}
                      onChange={e => setDotScale(parseInt(e.target.value))}
                    />
                  </label>

                  <label className="slider-label">
                    <div className="slider-header">
                      <span className="slider-text">Gap Between Dots</span>
                      <span className="slider-value">{gap}px</span>
                    </div>
                    <input 
                      type="range" 
                      className="slider"
                      min="0" 
                      max="12" 
                      step="1"
                      value={gap}
                      onChange={e => setGap(parseInt(e.target.value))}
                    />
                  </label>

                  <label className="slider-label">
                    <div className="slider-header">
                      <span className="slider-text">Columns (dots per row)</span>
                      <span className="slider-value">{columns}</span>
                    </div>
                    <input 
                      type="range" 
                      className="slider"
                      min="1" 
                      max="100" 
                      step="1"
                      value={columns}
                      onChange={e => setColumns(parseInt(e.target.value))}
                    />
                  </label>

                  <label className="form-label">
                    <span className="label-text">Dot Shape</span>
                    <div className="shape-selector">
                      <button 
                        className={`shape-btn ${shape === 'square' ? 'active' : ''}`}
                        onClick={() => setShape('square')}
                      >
                        <div className="shape-icon square-icon"></div>
                        Square
                      </button>
                      <button 
                        className={`shape-btn ${shape === 'circle' ? 'active' : ''}`}
                        onClick={() => setShape('circle')}
                      >
                        <div className="shape-icon circle-icon"></div>
                        Circle
                      </button>
                    </div>
                  </label>

                  {shape === 'square' && (
                    <label className="slider-label">
                      <div className="slider-header">
                        <span className="slider-text">Corner Radius</span>
                        <span className="slider-value">{radius}px</span>
                      </div>
                      <input 
                        type="range" 
                        className="slider"
                        min="0" 
                        max="16" 
                        step="1"
                        value={radius}
                        onChange={e => setRadius(parseInt(e.target.value))}
                      />
                    </label>
                  )}
                </div>

                <div className="control-group">
                  <h4 className="group-title">Colors</h4>
                  
                  <div className="color-grid">
                    <label className="color-label">
                      <span className="color-text">Background A</span>
                      <input 
                        type="color" 
                        className="color-input"
                        value={bg0}
                        onChange={e => setBg0(e.target.value)}
                      />
                      <span className="color-hex">{bg0}</span>
                    </label>

                    <label className="color-label">
                      <span className="color-text">Background B</span>
                      <input 
                        type="color" 
                        className="color-input"
                        value={bg1}
                        onChange={e => setBg1(e.target.value)}
                      />
                      <span className="color-hex">{bg1}</span>
                    </label>

                    <label className="color-label">
                      <span className="color-text">Past</span>
                      <input 
                        type="color" 
                        className="color-input"
                        value={pastColor}
                        onChange={e => setPastColor(e.target.value)}
                      />
                      <span className="color-hex">{pastColor}</span>
                    </label>

                    <label className="color-label">
                      <span className="color-text">Current</span>
                      <input 
                        type="color" 
                        className="color-input"
                        value={currentColor}
                        onChange={e => setCurrentColor(e.target.value)}
                      />
                      <span className="color-hex">{currentColor}</span>
                    </label>

                    <label className="color-label">
                      <span className="color-text">Future</span>
                      <input 
                        type="color" 
                        className="color-input"
                        value={futureColor}
                        onChange={e => setFutureColor(e.target.value)}
                      />
                      <span className="color-hex">{futureColor}</span>
                    </label>
                  </div>

                  <label className="slider-label">
                    <div className="slider-header">
                      <span className="slider-text">Future Opacity</span>
                      <span className="slider-value">{futureOpacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      className="slider"
                      min="0" 
                      max="100" 
                      step="1"
                      value={futureOpacity}
                      onChange={e => setFutureOpacity(parseInt(e.target.value))}
                    />
                  </label>
                </div>

                <div className="control-group">
                  <h4 className="group-title">Progress Display</h4>
                  
                  <label className="form-label">
                    <span className="label-text">Custom Text</span>
                    <input 
                      type="text" 
                      className="select-input"
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="e.g. active, completed, done"
                    />
                  </label>

                  <label className="form-label">
                    <span className="label-text">Show Percentage</span>
                    <div className="shape-selector">
                      <button 
                        className={`shape-btn ${showPercent ? 'active' : ''}`}
                        onClick={() => setShowPercent(true)}
                      >
                        ✓ Show
                      </button>
                      <button 
                        className={`shape-btn ${!showPercent ? 'active' : ''}`}
                        onClick={() => setShowPercent(false)}
                      >
                        ✗ Hide
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="preview-section">
                <h4 className="group-title">Live Preview</h4>
                <div className="preview-container">
                  <canvas ref={canvasRef} className="preview-canvas" />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Create Automation */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">2</span>
              <h3>Create Automation</h3>
            </div>
            
            <div className="step-content">
              <div className="instructions">
                <p>Open <strong>Shortcuts</strong> app → Go to <strong>Automation</strong> tab → <strong>New Automation</strong></p>
                <div className="instruction-items">
                  <div className="instruction-item">→ <strong>Time of Day</strong></div>
                  <div className="instruction-item">→ <strong>6:00 AM</strong></div>
                  <div className="instruction-item">→ Repeat <strong>"Daily"</strong></div>
                  <div className="instruction-item">→ Select <strong>"Run Immediately"</strong></div>
                  <div className="instruction-item">→ <strong>"Create New Shortcut"</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Create Shortcut */}
          <div className="step-card">
            <div className="step-header">
              <span className="step-number">3</span>
              <h3>Create Shortcut</h3>
            </div>
            
            <div className="step-content">
              <div className="instructions">
                <p className="highlight-text">ADD THESE ACTIONS:</p>
                
                <div className="action-step">
                  <div className="action-number">3.1</div>
                  <div className="action-content">
                    <strong>"Get Contents of URL"</strong> → paste the following URL there:
                    <div className="url-box">
                      <code className="url-text">{wallpaperUrl}</code>
                      <button className="copy-btn" onClick={copyToClipboard}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="action-step">
                  <div className="action-number">3.2</div>
                  <div className="action-content">
                    <strong>"Set Wallpaper Photo"</strong> → choose <strong>"Lock Screen"</strong>
                  </div>
                </div>

                <div className="warning-box">
                  <strong>Important:</strong> In "Set Wallpaper Photo", tap the arrow (→) to show options → disable both <strong>"Crop to Subject"</strong> and <strong>"Show Preview"</strong>
                  <div className="warning-note">
                    This prevents iOS from cropping and asking for confirmation each time
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="final-note">
          <h4>🎉 All Done!</h4>
          <p>Your wallpaper will now update automatically every day at 6:00 AM with your progress.</p>
        </div>
      </div>
    </section>
  )
}
