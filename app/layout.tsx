'use client'
import './globals.css'
import BottomNav from '@/components/BottomNav'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&family=Permanent+Marker&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#07030F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <title>Lock In ð</title>
      </head>
      <body>
        {/* Desktop block */}
        <div className="desktop-block">
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 64, letterSpacing: 4,
            background: 'linear-gradient(135deg, #FF1F6B, #00FFE0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>LOCK IN</div>
          <p style={{ color: '#8878AA', fontSize: 14 }}>ð± Mobile only. Open on your phone.</p>
          <p style={{ color: '#3D3260', fontSize: 12, marginTop: 8 }}>
            (or shrink your browser window below 600px)
          </p>
        </div>

        {/* Mobile shell */}
        <div className="mobile-shell">
          <Shell>{children}</Shell>
        </div>
      </body>
    </html>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuth = pathname === '/auth'

  return (
    <>
      {!isAuth && <AppHeader />}
      <div className="scroll-area">{children}</div>
      {!isAuth && <BottomNav />}
    </>
  )
}

function AppHeader() {
  return (
    <header style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 20px',
      paddingTop: 'calc(14px + env(safe-area-inset-top))',
      background: 'rgba(7,3,15,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,31,107,0.2)',
      position: 'relative',
      zIndex: 100,
    }}>
      {/* Left: flamingo emoji + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 22,
          display: 'inline-block',
          animation: 'flamingo-bob 3s ease-in-out infinite',
        }}>ð¦©</span>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 26,
          letterSpacing: 3,
          background: 'linear-gradient(135deg, #FF1F6B 0%, #FF6FA0 40%, #00FFE0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>LOCK IN</span>
      </div>

      {/* Right: tagline */}
      <div style={{
        fontFamily: 'Permanent Marker, cursive',
        fontSize: 10,
        color: 'rgba(255,31,107,0.6)',
        textAlign: 'right',
        lineHeight: 1.3,
        transform: 'rotate(-1deg)',
      }}>
        put $$ on it<br/>let em judge u
      </div>
    </header>
  )
}
