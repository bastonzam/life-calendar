import { useState, useEffect } from 'react'
import WallpaperMaker from './components/WallpaperMaker.jsx'
import AutomationGuide from './components/AutomationGuide.jsx'
import WallpaperDisplay from './components/WallpaperDisplay.jsx'

export default function App(){
  const [page, setPage] = useState('automation')

  useEffect(() => {
    // ตรวจสอบ URL parameters
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'wallpaper') {
      setPage('wallpaper-display')
      return
    }
    
    // ตรวจสอบ hash สำหรับการนำทาง
    const hash = window.location.hash.replace('#', '')
    if (hash === 'generator') {
      setPage('generator')
    } else {
      setPage('automation')
    }

    // รับฟัง hash change
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '')
      if (newHash === 'generator') {
        setPage('generator')
      } else {
        setPage('automation')
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // ถ้าเป็นโหมดแสดง wallpaper ให้แสดงเฉพาะรูป
  if (page === 'wallpaper-display') {
    return <WallpaperDisplay />
  }

  const navigateTo = (newPage) => {
    if (newPage === 'automation') {
      window.location.hash = ''
      setPage('automation')
    } else if (newPage === 'generator') {
      window.location.hash = 'generator'
      setPage('generator')
    }
  }

  // หน้าปกติ
  return (
    <main>
      <header className="header">
        <div className="container row between center">
          <div className="logo-section">
            Life Calendar<sup className="tag">Wallpaper</sup>
          </div>
          <nav className="nav">
            <a 
              href="#" 
              className={page === 'automation' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); navigateTo('automation') }}
            >
              iOS Automation
            </a>
            <a 
              href="#generator" 
              className={page === 'generator' ? 'active' : ''}
              onClick={(e) => { e.preventDefault(); navigateTo('generator') }}
            >
              Wallpaper Generator
            </a>
          </nav>
        </div>
      </header>

      {page === 'automation' && (
        <>
          <section className="hero">
            <div className="container">
              <h1>Life Calendar — Wallpaper Generator</h1>
              <p className="lead">สร้างวอลเปเปอร์ที่อัปเดตอัตโนมัติทุกวันบน iPhone ของคุณ</p>
            </div>
          </section>

          <AutomationGuide />
        </>
      )}

      {page === 'generator' && (
        <>
          <section className="hero">
            <div className="container">
              <h1>Wallpaper Generator</h1>
              <p className="lead">สร้างและดาวน์โหลดวอลเปเปอร์ Life Calendar แบบกำหนดเองได้เต็มที่</p>
            </div>
          </section>

          <WallpaperMaker />
        </>
      )}

      <footer className="footer">
        <div className="container small">© {new Date().getFullYear()} — demo</div>
      </footer>
    </main>
  )
}
