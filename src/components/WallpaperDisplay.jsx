import React, { useEffect, useRef, useState } from 'react'
import { drawWallpaper } from '../lib/generateWallpaper.js'

export default function WallpaperDisplay() {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      // อ่าน URL parameters
      const params = new URLSearchParams(window.location.search)
      
      const width = parseInt(params.get('width') || '1179', 10)
      const height = parseInt(params.get('height') || '2556', 10)
      const style = params.get('style') || 'days'
      
      // Custom parameters
      const cellSize = parseInt(params.get('cellSize') || '12', 10)
      const gap = parseInt(params.get('gap') || '2', 10)
      const radius = parseInt(params.get('radius') || '3', 10)
      const dotScale = parseFloat(params.get('dotScale') || '0.9')
      const shape = params.get('shape') || 'square'
      
      // Get columns from URL or use default based on style
      let defaultCols = 53
      if (style === 'weeks') defaultCols = 52
      else if (style === 'months') defaultCols = 12
      const cols = parseInt(params.get('columns') || defaultCols, 10)
      
      // Colors
      const bg0 = params.get('bg0') || '#0b0c0f'
      const bg1 = params.get('bg1') || '#1a0f2b'
      const pastColor = params.get('past') || '#5cc8ff'
      const currentColor = params.get('current') || '#f59e0b'
      const futureColor = params.get('future') || '#ffffff'
      const futureOpacity = parseInt(params.get('futureOpacity') || '16', 10)
      
      // Progress Display
      const customText = params.get('customText') || 'active'
      const showPercent = params.get('showPercent') === '1'
      
      // สร้าง futureColor rgba
      const futureColorRgba = `rgba(${parseInt(futureColor.slice(1,3), 16)}, ${parseInt(futureColor.slice(3,5), 16)}, ${parseInt(futureColor.slice(5,7), 16)}, ${(futureOpacity / 100).toFixed(2)})`
      
      // กำหนดค่าตาม style
      let units, caption
      const now = new Date()
      
      if (style === 'days') {
        // Days of year
        const isLeap = (now.getFullYear() % 4 === 0) && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)
        units = isLeap ? 366 : 365
        
        // คำนวณ day of year
        const start = new Date(now.getFullYear(), 0, 1)
        const currentIdx = Math.floor((now - start) / (24 * 60 * 60 * 1000))
        
        caption = `Progress of Year — ${now.getFullYear()}`
        
        renderWallpaper({
          width, height,
          mode: 'custom',
          units,
          currentIndex: currentIdx,
          columns: cols,
          caption,
          bg0, bg1,
          pastColor,
          currentColor,
          futureColor: futureColorRgba,
          cellSize, gap, radius, shape, dotScale,
          margin: 40,
          captionFont: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif',
          captionWeight: 700,
          captionItalic: false,
          customText,
          showPercent,
        })
        
      } else if (style === 'weeks') {
        // Weeks of year (สัปดาห์ของปีนี้ปีเดียว)
        units = 52
        caption = `Progress of Year - 52 Weeks`
        
        // คำนวณสัปดาห์ที่เท่าไหร่ของปีนี้ (0-51)
        const startOfYear = new Date(now.getFullYear(), 0, 1)
        const dayOfYear = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000))
        const currentIdx = Math.floor(dayOfYear / 7)
        
        renderWallpaper({
          width, height,
          mode: 'custom',
          units,
          currentIndex: currentIdx,
          columns: cols,
          caption,
          bg0, bg1,
          pastColor,
          currentColor,
          futureColor: futureColorRgba,
          cellSize, gap, radius, shape, dotScale,
          margin: 40,
          captionFont: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif',
          captionWeight: 700,
          captionItalic: false,
          customText,
          showPercent,
        })
        
      } else if (style === 'months') {
        // 12 months
        units = 12
        const currentIdx = now.getMonth() // 0-11
        caption = `Year Progress - 12 Months — ${now.getFullYear()}`
        
        renderWallpaper({
          width, height,
          mode: 'custom',
          units,
          currentIndex: currentIdx,
          columns: cols,
          caption,
          bg0, bg1,
          pastColor,
          currentColor,
          futureColor: futureColorRgba,
          cellSize, gap, radius, shape, dotScale,
          margin: 40,
          captionFont: 'system-ui, -apple-system, Segoe UI, Roboto, Noto Sans Thai, sans-serif',
          captionWeight: 700,
          captionItalic: false,
          customText,
          showPercent,
        })
      }
      
    } catch (err) {
      console.error('Error rendering wallpaper:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  const renderWallpaper = (options) => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = options.width
    canvas.height = options.height
    
    const ctx = canvas.getContext('2d')
    
    // รอฟอนต์โหลด
    const fontsReady = ('fonts' in document && document.fonts && document.fonts.ready)
      ? document.fonts.ready.catch(() => {})
      : Promise.resolve()
    
    fontsReady.then(() => {
      drawWallpaper(ctx, options)
      setLoading(false)
    })
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: '#0b0c0f', 
        color: '#e9edf1',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#0b0c0f',
      padding: 0,
      margin: 0
    }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          color: '#5cc8ff',
          fontSize: '1.2rem'
        }}>
          Generating wallpaper...
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100vh',
          display: loading ? 'none' : 'block'
        }} 
      />
    </div>
  )
}
