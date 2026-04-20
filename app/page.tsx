'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function Home() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  const bets = data?.bets || []

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div className="header">
        <div className="logo">LOCK IN</div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 10, color: 'var(--pink)', textAlign: 'right', lineHeight: 1.3 }}>PUT $$ ON IT<br />LET EM JUDGE U</div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {bets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: 'var(--text-muted)', letterSpacing: 1 }}>No bets yet</div>
            <p style={{ color: 'var(--text-faint)', fontSize: 14, marginBottom: 24 }}>Create one or get someone to invite you</p>
            <button className="btn-primary" onClick={() => router.push('/create')} style={{ maxWidth: 200 }}>CREATE A BET</button>
          </div>
        ) : bets.map((bet) => (
          <div key={bet.id} onClick={() => router.push('/bet/' + bet.id)} style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 12, cursor: 'pointer', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ background: bet.status === 'active' ? 'rgba(0,255,224,0.1)' : bet.status === 'settled' ? 'rgba(255,215,0,0.1)' : 'rgba(255,31,107,0.1)', color: bet.status === 'active' ? 'var(--teal)' : bet.status === 'settled' ? 'var(--gold)' : 'var(--pink)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '2px 8px', borderRadius: 99, border: '1px solid currentColor' }}>
                {bet.status?.toUpperCase()}
              </span>
              {data?.user && bet.participants?.find(p => p.user_id === data.user.id) && (
                <span style={{ background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '2px 8px', borderRadius: 99, border: '1px solid currentColor' }}>
                  YOU: {bet.participants.find(p => p.user_id === data.user.id)?.side?.toUpperCase()}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1 }}>
              {bet.about_self ? 'SELF BET' : 'MUTUAL BET'}
            </div>
            <div style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.4, marginBottom: 10 }}>{bet.text}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 11, padding: '3px 8px', borderRadius: 99 }}>
                {'$' + Number(bet.stake_amount) + ' stake'}
              </span>
              {bet.proof_photo && <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 11, padding: '3px 8px', borderRadius: 99 }}>Photo</span>}
              {bet.proof_video && <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 11, padding: '3px 8px', borderRadius: 99 }}>Video</span>}
              {bet.proof_geolocation && <span style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: 11, padding: '3px 8px', borderRadius: 99 }}>Location</span>}
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="feed" />
    </div>
  )
}