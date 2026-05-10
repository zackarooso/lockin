'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'

export default function Scorecard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const r = await fetch('/api/me')
    if (r.ok) { const d = await r.json(); setData(d) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function settle(entryId: number) {
    const res = await fetch('/api/bets/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId }),
    })
    if (res.ok) load()
  }

  if (loading) return <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  const ledger: any[] = data?.ledger || []
  const winnings = ledger.filter((e: any) => e.type === 'win').reduce((s: number, e: any) => s + Number(e.amount), 0)
  const losses = ledger.filter((e: any) => e.type === 'loss').reduce((s: number, e: any) => s + Number(e.amount), 0)
  const net = winnings - losses

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 2, color: 'var(--text)', marginBottom: 16 }}>SCORECARD</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'WON', value: '$' + winnings.toFixed(0), color: 'var(--teal)' },
            { label: 'LOST', value: '$' + losses.toFixed(0), color: 'var(--pink)' },
            { label: 'NET', value: (net >= 0 ? '+$' : '-$') + Math.abs(net).toFixed(0), color: net >= 0 ? 'var(--teal)' : 'var(--pink)' },
          ].map((stat: any) => (
            <div key={stat.label} style={{ background: 'var(--surface)', borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>HISTORY</div>

        {ledger.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: 14 }}>No settled bets yet</div>
        ) : ledger.map((entry: any) => {
          const text = (entry.bet_text || '').slice(0, 40)
          const isWin = entry.type === 'win'
          const isLoss = entry.type === 'loss'
          return (
            <div key={entry.id} style={{ background: 'var(--surface)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text || 'Bet'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1 }}>
                    {(entry.type || '').toUpperCase()}{entry.settled_irl ? ' \u2022 SETTLED IRL' : ''}
                  </div>
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: isWin ? 'var(--teal)' : isLoss ? 'var(--pink)' : 'var(--text-muted)', marginLeft: 12 }}>
                  {isWin ? '+' : isLoss ? '-' : ''}${Number(entry.amount).toFixed(0)}
                </div>
              </div>
              {(isWin || isLoss) && !entry.settled_irl && (
                <button onClick={() => settle(entry.id)} style={{
                  marginTop: 8, width: '100%', padding: '8px',
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text-muted)', fontSize: 11,
                  fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, cursor: 'pointer',
                }}>
                  MARK SETTLED IRL
                </button>
              )}
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
