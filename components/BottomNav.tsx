'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const p = usePathname()
  const isHome = p === '/'
  const isScore = p === '/scorecard'

  return (
    <nav style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(7,3,15,0.97)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,31,107,0.2)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      position: 'relative',
      zIndex: 100,
    }}>
      <NavBtn href="/" active={isHome} icon="" label="Feed" />

      {/* FAB */}
      <Link href="/create" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <button style={{
          width: 60, height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF0055, #FF1F6B, #FF6FA0)',
          border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          cursor: 'pointer',
          margin: '-18px 12px 0',
          boxShadow: '0 4px 24px rgba(255,31,107,0.6), 0 0 0 1px rgba(255,31,107,0.3)',
          animation: 'pulse-glow 3s ease-in-out infinite',
          transition: 'transform var(--transition)',
        }}> </button>
      </Link>

      <NavBtn href="/scorecard" active={isScore} icon="" label="Score" />
    </nav>
  )
}

function NavBtn({ href, active, icon, label }: { href: string; active: boolean; icon: string; label: string }) {
  return (
    <Link href={href} style={{ flex: 1, textDecoration: 'none' }}>
      <button style={{
        width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '12px 8px',
        border: 'none', background: 'none',
        cursor: 'pointer',
        opacity: active ? 1 : 0.4,
        transition: 'opacity var(--transition)',
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: 11, letterSpacing: 1.5,
          color: active ? 'var(--pink)' : 'var(--text-muted)',
        }}>{label}</span>
      </button>
    </Link>
  )
}
