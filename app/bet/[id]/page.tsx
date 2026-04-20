'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

function StatusBadge({ status }) {
  const map = {
    open:      { label: 'OPEN',      bg: 'rgba(255,31,107,0.1)',  color: 'var(--pink)' },
    active:    { label: 'ACTIVE',    bg: 'rgba(0,255,224,0.1)',   color: 'var(--teal)' },
    voting:    { label: 'VOTING',    bg: 'rgba(255,215,0,0.1)',   color: 'var(--gold)' },
    settled:   { label: 'SETTLED',   bg: 'rgba(255,215,0,0.1)',   color: 'var(--gold)' },
    nullified: { label: 'NULLIFIED', bg: 'rgba(120,120,120,0.1)', color: '#888' },
  }
  const s = map[status] || map.open
  return <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, border: '1px solid currentColor' }}>{s.label}</span>
}

export default function BetPage({ params }) {
  const router = useRouter()
  const [bet, setBet] = useState(null)
  const [votes, setVotes] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [joinSide, setJoinSide] = useState('yes')
  const [joinAmount, setJoinAmount] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/bets/' + params.id)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setBet(d.bet); setVotes(d.votes || []); setCurrentUserId(d.currentUserId) }
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [params.id])

  async function joinBet() {
    if (!joinAmount || parseFloat(joinAmount) <= 0) { setError('Enter stake amount'); return }
    setJoining(true); setError('')
    const res = await fetch('/api/bets/join', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_id: bet.id, side: joinSide, amount: parseFloat(joinAmount) })
    })
    const data = await res.json()
    setJoining(false)
    if (res.ok) window.location.reload()
    else setError(data.error || 'Failed to join')
  }

  function copyLink() {
    const url = 'https://lockin-production-1278.up.railway.app/bet/' + params.id
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
  if (!bet) return <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Bet not found</div>

  const participants = bet.participants || []
  const yesPool = participants.filter(p => p.side === 'yes').reduce((s, p) => s + Number(p.amount), 0)
  const noPool  = participants.filter(p => p.side === 'no').reduce((s, p) => s + Number(p.amount), 0)
  const total   = yesPool + noPool || 1
  const yesPct  = Math.round((yesPool / total) * 100)
  const noPct   = 100 - yesPct

  const isParticipant = participants.some(p => Number(p.user_id) === Number(currentUserId))
  const isSubject = Number(bet.subject_user_id) === Number(currentUserId)
  const canJoin = !isParticipant && !isSubject && (bet.status === 'open' || bet.status === 'active')
  const canVote = isParticipant && !isSubject && bet.status === 'voting' && !votes.some(v => Number(v.voter_user_id) === Number(currentUserId))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div className="header">
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', padding: 0 }}>back</button>
        <div className="logo" style={{ fontSize: 28 }}>LOCK IN</div>
        <div />
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge status={bet.status} />
          {isParticipant && <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', border: '1px solid currentColor' }}>
            YOU: {participants.find(p => Number(p.user_id) === Number(currentUserId))?.side?.toUpperCase()}
          </span>}
        </div>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 6 }}>
          {bet.about_self ? 'SELF BET' : 'MUTUAL BET'}
        </div>
        <div style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1.5, marginBottom: 20 }}>{bet.text}</div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', marginBottom: 12 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>YES POOL</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--teal)' }}>{'$' + yesPool}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{yesPct + '%'}</div>
            </div>
            <div style={{ width: 1, background: 'var(--border)' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>NO POOL</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--pink)' }}>{'$' + noPool}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{noPct + '%'}</div>
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: yesPct + '%', background: 'linear-gradient(90deg, var(--teal), var(--pink))', borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--teal)', fontFamily: 'Bebas Neue, sans-serif' }}>{'YES ' + yesPct + '%'}</span>
            <span style={{ fontSize: 10, color: 'var(--pink)', fontFamily: 'Bebas Neue, sans-serif' }}>{'NO ' + noPct + '%'}</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="section-label">Whos in</div>
          {participants.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text)', fontSize: 15 }}>
                {p.display_name || p.phone}
                {Number(p.user_id) === Number(currentUserId) && <span style={{ color: 'var(--text-muted)', fontSize: 12 }}> (you)</span>}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{'$' + Number(p.amount)}</span>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, padding: '2px 8px', borderRadius: 99, background: p.side === 'yes' ? 'rgba(0,255,224,0.15)' : 'rgba(255,31,107,0.15)', color: p.side === 'yes' ? 'var(--teal)' : 'var(--pink)' }}>{p.side?.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>JOIN BY</div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>{new Date(bet.join_deadline).toLocaleDateString()}</div>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 12, padding: 12 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1, marginBottom: 4 }}>ENDS</div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>{new Date(bet.end_time).toLocaleDateString()}</div>
          </div>
        </div>

        <button onClick={copyLink} style={{ width: '100%', padding: 14, borderRadius: 14, cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid rgba(0,255,224,0.3)', color: copied ? 'var(--teal)' : 'var(--teal)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: 1, marginBottom: 16 }}>
          {copied ? 'COPIED!' : 'COPY INVITE LINK'}
        </button>

        {canJoin && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>JOIN THIS BET</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {['yes', 'no'].map(side => (
                <button key={side} onClick={() => setJoinSide(side)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid ' + (joinSide === side ? (side === 'yes' ? 'var(--teal)' : 'var(--pink)') : 'var(--border)'), background: joinSide === side ? (side === 'yes' ? 'rgba(0,255,224,0.1)' : 'rgba(255,31,107,0.1)') : 'transparent', color: joinSide === side ? (side === 'yes' ? 'var(--teal)' : 'var(--pink)') : 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: 2, cursor: 'pointer' }}>
                  {side.toUpperCase()}
                </button>
              ))}
            </div>
            <input className="form-input" type="number" value={joinAmount} placeholder="Your stake ($)" min="1"
              onChange={e => setJoinAmount(e.target.value)} style={{ marginBottom: 12 }} />
            {error && <p style={{ color: 'var(--pink)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
            <button className="btn-primary" onClick={joinBet} disabled={joining}>{joining ? '...' : "I'M IN"}</button>
          </div>
        )}

        {canVote && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>CAST YOUR VOTE</div>
            <button className="btn-primary" onClick={() => router.push('/bet/' + params.id + '/vote')} style={{ marginBottom: 0 }}>VOTE NOW</button>
          </div>
        )}
      </div>
      <BottomNav active="feed" />
    </div>
  )
}