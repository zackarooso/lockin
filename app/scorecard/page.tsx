'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'

export default function Scorecard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  const ledger = data?.ledger || []
  const winnings = ledger.filter(e => e.type === 'win').reduce((s, e) => s + Number(e.amount), 0)
  const losses = ledger.filter(e => e.type === 'loss').reduce((s, e) => s + Number(e.amount), 0)
  const net = winnings - losses

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div className="header">
        <div className="logo">LOCK IN</div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 10, color: 'var(--pink)', textAlign: 'right', lineHeight: 1.3 }}>PUT $$ ON IT<br />LET EM JUDGE U</div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 2, color: 'var(--text)', marginBottom: 16 }}>SCORECARD</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'WON', value: '$' + winnings.toFixed(0), color: 'var(--teal)' },
            { label: 'LOST', value: '$' + losses.toFixed(0), color: 'var(--pink)' },
            { label: 'NET', value: (net >= 0 ? '+$' : '-$') + Math.abs(net).toFixed(0), color: net >= 0 ? 'var(--teal)' : 'var(--pink)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>HISTORY</div>

        {ledger.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 14 }}>No settled bets yet</div>
        ) : ledger.map(entry => (
          <div key={entry.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{entry.bet_text?.slice(0, 40)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1 }}>{entry.type?.toUpperCase()}</div>
            </div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: entry.type === 'win' ? 'var(--teal)' : 'var(--pink)' }}>
              {entry.type === 'win' ? '+' : '-'}{'$' + Number(entry.amount).toFixed(0)}
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="score" />
    </div>
  )
}