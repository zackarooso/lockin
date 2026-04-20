'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bets, setBets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(d => {
      if (d.error) { router.replace('/auth'); return }
      setUser(d.user); setBets(d.bets || []); setLoading(false)
    }).catch(() => router.replace('/auth'))
  }, [])

  if (loading) return <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: 'var(--pink)' }}>Loading...</div></div>

  function statusColor(s) {
    const map = { active: 'var(--teal)', open: 'var(--gold)', settled: '#888', voting: 'var(--pink)', nullified: '#666' }
    return map[s] || 'var(--text-muted)'
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 80 }}>
      <header style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, background: 'linear-gradient(135deg, #FF1F6B, #00FFE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: 3 }}>LOCK IN</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hey, {user?.display_name || 'friend'}</div>
      </header>
      <div style={{ padding: '0 16px' }}>
        {bets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: 'var(--text-muted)', letterSpacing: 1 }}>No bets yet</div>
            <p style={{ color: 'var(--text-faint)', fontSize: 14, marginTop: 8 }}>Create your first bet or get invited by a friend.</p>
          </div>
        ) : bets.map((bet: any) => {
          const yesPool = (bet.participants || []).filter((p: any) => p.side === 'yes').reduce((s: number, p: any) => s + Number(p.amount), 0)
          const noPool = (bet.participants || []).filter((p: any) => p.side === 'no').reduce((s: number, p: any) => s + Number(p.amount), 0)
          const total = yesPool + noPool || 1
          const myP = (bet.participants || []).find((p: any) => p.user_id === user?.id)
          return (
            <div key={bet.id} onClick={() => router.push('/bet/' + bet.id)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, color: statusColor(bet.status), border: '1px solid ' + statusColor(bet.status), borderRadius: 6, padding: '2px 8px' }}>{(bet.status || 'open').toUpperCase()}</span>
                {myP && <span style={{ fontSize: 11, fontFamily: 'Bebas Neue, sans-serif', color: myP.side === 'yes' ? 'var(--teal)' : 'var(--pink)', border: '1px solid ' + (myP.side === 'yes' ? 'var(--teal)' : 'var(--pink)'), borderRadius: 6, padding: '2px 8px' }}>YOU: {myP.side.toUpperCase()}</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>{bet.about_self ? 'SELF BET' : 'MUTUAL BET'}</div>
              <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.4, marginBottom: 10 }}>{bet.text}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', borderRadius: 8, padding: '3px 10px', fontFamily: 'Bebas Neue, sans-serif' }}>${Number(bet.stake_amount)} stake</span>
                {bet.proof_photo && <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', borderRadius: 8, padding: '3px 10px', fontFamily: 'Bebas Neue, sans-serif' }}>Photo</span>}
                {bet.proof_video && <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', borderRadius: 8, padding: '3px 10px', fontFamily: 'Bebas Neue, sans-serif' }}>Video</span>}
                {bet.proof_geolocation && <span style={{ fontSize: 11, background: 'var(--surface-2)', color: 'var(--text-muted)', borderRadius: 8, padding: '3px 10px', fontFamily: 'Bebas Neue, sans-serif' }}>Location</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (yesPool/total*100) + '%', background: 'linear-gradient(90deg, var(--teal), #00cc88)' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--teal)', fontFamily: 'Bebas Neue, sans-serif' }}>YES ${yesPool}</span>
                <span style={{ fontSize: 11, color: 'var(--pink)', fontFamily: 'Bebas Neue, sans-serif' }}>NO ${noPool}</span>
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav active="feed" />
    </div>
  )
}