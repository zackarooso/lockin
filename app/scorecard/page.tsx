'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ScorecardPage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me')
      .then(r => { if (r.status === 401) { router.replace('/auth'); return null } return r.json() })
      .then(d => { if (d) { setData(d); setLoading(false) } })
  }, [router])

  async function settle(entryId: number) {
    await fetch('/api/bets/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_id: entryId }),
    })
    setData((prev: any) => ({
      ...prev,
      ledger: prev.ledger.map((e: any) => e.id === entryId ? { ...e, settled_irl: 1 } : e),
    }))
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80dvh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40, animation: 'flamingo-bob 1.5s ease-in-out infinite' }}>💸</div>
    </div>
  )

  const { user, ledger } = data
  const wins   = ledger.filter((e: any) => e.type === 'win')
  const losses = ledger.filter((e: any) => e.type === 'loss')
  const settled = ledger.filter((e: any) => e.type !== 'nullify')
  const net = wins.reduce((s: number, e: any) => s + e.amount, 0) - losses.reduce((s: number, e: any) => s + e.amount, 0)
  const winRate = settled.length > 0 ? Math.round(wins.length / settled.length * 100) : 0
  const totalWon  = wins.reduce((s: number, e: any) => s + e.amount, 0)
  const totalLost = losses.reduce((s: number, e: any) => s + e.amount, 0)
  const outstanding = ledger.filter((e: any) => !e.settled_irl && e.type !== 'nullify')

  return (
    <div className="screen-pad" style={{ paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 44, letterSpacing: 2, lineHeight: 0.9 }}>
          <span style={{ background: 'linear-gradient(135deg, #FF0055, #FF6FA0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {user.display_name}'s
          </span>
          <br />
          <span style={{ color: 'var(--text)' }}>Scorecard</span>
        </div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 11, color: 'var(--text-muted)', marginTop: 4, transform: 'rotate(-1deg)' }}>
          receipts don't lie 🧾
        </div>
      </div>

      {/* Net position hero */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface), rgba(255,31,107,0.08))',
        border: '1px solid rgba(255,31,107,0.25)',
        borderRadius: 24, padding: '28px 24px', marginBottom: 20,
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative */}
        <div style={{
          position: 'absolute', top: -30, right: -30, fontSize: 100, opacity: 0.04,
          fontFamily: 'Bebas Neue, sans-serif', transform: 'rotate(15deg)', userSelect: 'none',
          color: net >= 0 ? '#00FFE0' : '#FF1F6B',
        }}>
          {net >= 0 ? 'WIN' : 'L'}
        </div>

        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 3, color: 'var(--text-muted)', marginBottom: 8 }}>
          Net Position
        </div>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 72, lineHeight: 1, letterSpacing: 2,
          color: net >= 0 ? 'var(--teal)' : 'var(--pink)',
          filter: `drop-shadow(0 0 30px ${net >= 0 ? 'rgba(0,255,224,0.4)' : 'rgba(255,31,107,0.4)'})`,
        }}>
          {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(0)}
        </div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 14, color: net >= 0 ? 'var(--teal)' : 'var(--pink)', marginTop: 6, opacity: 0.7 }}>
          {getNetComment(net)}
        </div>
      </div>

      {/* 4-stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        <StatCard label="Total Won" value={`$${totalWon.toFixed(0)}`} color="var(--teal)" icon="🏆" />
        <StatCard label="Total Lost" value={`$${totalLost.toFixed(0)}`} color="var(--pink)" icon="💸" />
        <StatCard label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? 'var(--teal)' : 'var(--pink)'} icon="📊" />
        <StatCard label="Total Bets" value={ledger.length.toString()} color="var(--white)" icon="🎰" />
      </div>

      {/* Ferrari bar - win vs loss visual */}
      {settled.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 700 }}>W {wins.length}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Permanent Marker, cursive' }}>the scoreboard</span>
            <span style={{ fontSize: 11, color: 'var(--pink)', fontWeight: 700 }}>L {losses.length}</span>
          </div>
          <div style={{ height: 12, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${winRate}%`,
              background: 'linear-gradient(90deg, var(--teal), #00C8B0)',
              borderRadius: 99, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>
      )}

      {/* Outstanding IOUs */}
      {outstanding.length > 0 && (
        <>
          <div className="section-label">💰 settle up</div>
          {outstanding.map((e: any) => (
            <div key={e.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${e.type === 'win' ? 'rgba(0,255,224,0.2)' : 'rgba(255,31,107,0.2)'}`,
              borderLeft: `4px solid ${e.type === 'win' ? 'var(--teal)' : 'var(--pink)'}`,
              borderRadius: 14, padding: '14px 16px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
                  {e.bet_text}
                </div>
                <div style={{ fontSize: 12, color: e.type === 'win' ? 'var(--teal)' : 'var(--pink)', fontWeight: 700 }}>
                  {e.type === 'win' ? `+$${e.amount.toFixed(0)} they owe you` : `-$${e.amount.toFixed(0)} you owe them`}
                </div>
              </div>
              <button onClick={() => settle(e.id)} style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 14px', color: 'var(--text-muted)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Permanent Marker, cursive', whiteSpace: 'nowrap',
              }}>
                ✓ paid
              </button>
            </div>
          ))}
        </>
      )}

      {/* History */}
      {ledger.length > 0 && (
        <>
          <div className="section-label">📋 history</div>
          {ledger.map((e: any) => (
            <div key={e.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid rgba(255,31,107,0.06)',
            }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 3, lineHeight: 1.3 }}>
                  {e.bet_text}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                  {new Date(e.created_at).toLocaleDateString()}
                  {e.settled_irl ? ' · ✓ settled' : ''}
                </div>
              </div>
              <div style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 0.5,
                color: e.type === 'win' ? 'var(--teal)' : e.type === 'loss' ? 'var(--pink)' : 'var(--text-faint)',
              }}>
                {e.type === 'win' ? `+$${e.amount.toFixed(0)}` : e.type === 'loss' ? `-$${e.amount.toFixed(0)}` : 'NULL'}
              </div>
            </div>
          ))}
        </>
      )}

      {ledger.length === 0 && (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: 60, marginBottom: 16, animation: 'flamingo-bob 3s ease-in-out infinite' }}>🦩</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--text)', marginBottom: 8 }}>Clean Slate</div>
          <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 13, color: 'var(--text-muted)' }}>
            no bets settled yet.<br />get in the game.
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon }: any) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '18px 16px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 10, right: 14, fontSize: 22, opacity: 0.15 }}>{icon}</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 34, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function getNetComment(net: number) {
  if (net > 500)  return 'ferrari money fr fr 🏎️'
  if (net > 200)  return 'balling out 🦩'
  if (net > 50)   return 'up bad in the best way'
  if (net > 0)    return 'slightly ahead 📈'
  if (net === 0)  return 'dead even. boring.'
  if (net > -50)  return 'a lil rough 😬'
  if (net > -200) return 'take the L. learn from it.'
  return 'absolutely cooked 🔥'
}
