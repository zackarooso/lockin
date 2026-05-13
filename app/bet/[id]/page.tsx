'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    open:     { label: 'OPEN',      bg: 'rgba(255,31,107,0.1)',  color: 'var(--pink)' },
    active:   { label: 'ACTIVE',    bg: 'rgba(0,255,224,0.1)',   color: 'var(--teal)' },
    voting:   { label: 'VOTING',    bg: 'rgba(255,215,0,0.1)',   color: 'var(--gold)' },
    settled:  { label: 'SETTLED',   bg: 'rgba(255,215,0,0.1)',   color: 'var(--gold)' },
    nullified:{ label: 'NULLIFIED', bg: 'rgba(120,120,120,0.1)', color: '#888' },
  }
  const s = map[status] || map.open
  return <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '3px 10px', borderRadius: 99, background: s.bg, color: s.color, border: '1px solid currentColor' }}>{s.label}</span>
}

export default function BetPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [bet, setBet] = useState<any>(null)
  const [votes, setVotes] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [fundsModal, setFundsModal] = useState<{needed: number, balance: number, onramp_url: string} | null>(null)
  const [joinSide, setJoinSide] = useState<'yes'|'no'>('yes')
  const [joinAmount, setJoinAmount] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [closing, setClosing] = useState<string | null>(null)
  const [closeError, setCloseError] = useState('')

  function reload() {
    fetch('/api/bets/' + params.id)
      .then(r => r.ok ? r.json() : null)
      .then((d: any) => {
        if (d) { setBet(d.bet); setVotes(d.votes || []); setCurrentUserId(d.currentUserId) }
        setLoading(false)
      }).catch(() => setLoading(false))
  }

  useEffect(() => { reload() }, [params.id])

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
    else if (data.error === 'insufficient_funds') setFundsModal({needed: data.needed, balance: data.balance, onramp_url: data.onramp_url})
    else setError(data.error || 'Failed to join')
  }

  function copyLink() {
    const url = window.location.origin + '/bet/' + params.id
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {})
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function doClose(action: 'force_voting' | 'finalize' | 'nullify', confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return
    setClosing(action); setCloseError('')
    try {
      const res = await fetch('/api/bets/close', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet_id: Number(params.id), action })
      })
      const data = await res.json()
      if (!res.ok) { setCloseError(data.error || 'Failed'); setClosing(null); return }
      setClosing(null)
      reload()
    } catch (e: any) {
      setCloseError(e.message || 'Failed')
      setClosing(null)
    }
  }

  if (loading) return <div style={{ minHeight: '60dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
  if (!bet) return <div style={{ minHeight: '60dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Bet not found</div>

  const participants = bet.participants || []
  const yesPool = participants.filter((p: any) => p.side === 'yes').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const noPool  = participants.filter((p: any) => p.side === 'no').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const total = yesPool + noPool || 1
  const yesPct = Math.round((yesPool / total) * 100)
  const noPct = 100 - yesPct

  const isParticipant = participants.some((p: any) => Number(p.user_id) === Number(currentUserId))
  const isSubject     = Number(bet.subject_user_id) === Number(currentUserId)
  const isCreator     = Number(bet.creator_user_id) === Number(currentUserId)
  const canJoin = !isParticipant && !isSubject && (bet.status === 'open' || bet.status === 'active')
  const canVote = isParticipant && !isSubject && bet.status === 'voting' && !votes.some((v: any) => Number(v.voter_user_id) === Number(currentUserId))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div style={{ padding: '16px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', padding: 0, marginBottom: 12, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 1 }}>{'\u2190'} BACK</button>

        <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge status={bet.status} />
          {isParticipant && <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,215,0,0.1)', color: 'var(--gold)', border: '1px solid currentColor' }}>
            YOU: {participants.find((p: any) => Number(p.user_id) === Number(currentUserId))?.side?.toUpperCase()}
          </span>}
          {isCreator && <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 11, letterSpacing: 1, padding: '3px 10px', borderRadius: 99, background: 'rgba(255,31,107,0.1)', color: 'var(--pink)', border: '1px solid currentColor' }}>CREATOR</span>}
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
          <div className="section-label">Who is in</div>
          {participants.length === 0 && (
            <div style={{ color: 'var(--text-faint)', fontSize: 13, padding: '10px 0' }}>No one yet. Share the link.</div>
          )}
          {participants.map((p: any) => (
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
            <div style={{ fontSize: 14, color: 'var(--text)' }}>
              <span style={{ marginRight: 6 }}>{'\u23F0'}</span>
              {new Date(bet.end_time).toLocaleDateString()}
            </div>
          </div>
        </div>

        <button onClick={copyLink} style={{ width: '100%', padding: 14, borderRadius: 14, cursor: 'pointer', background: 'var(--surface-2)', border: '1px solid rgba(0,255,224,0.3)', color: copied ? 'var(--teal)' : 'var(--teal)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: 1, marginBottom: 16 }}>
          {copied ? 'COPIED!' : 'COPY INVITE LINK'}
        </button>

        {canJoin && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>JOIN THIS BET</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['yes', 'no'] as const).map(side => (
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
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>CAST YOUR VOTE</div>
            <button className="btn-primary" onClick={() => router.push('/bet/' + params.id + '/vote')} style={{ marginBottom: 0 }}>VOTE NOW</button>
          </div>
        )}

        {isCreator && (bet.status === 'open' || bet.status === 'active' || bet.status === 'voting') && (
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 16, marginBottom: 16, border: '1px solid rgba(255,31,107,0.3)' }}>
            <div className="section-label" style={{ marginBottom: 12 }}>CREATOR ACTIONS</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
              Bets auto-move to voting when the end time passes. Use these to override.
            </p>
            {(bet.status === 'open' || bet.status === 'active') && (
              <button
                onClick={() => doClose('force_voting', 'Move this bet to VOTING now? Participants will be able to vote.')}
                disabled={closing !== null}
                style={{ width: '100%', padding: 14, borderRadius: 12, cursor: 'pointer', background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)', color: 'var(--gold)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, letterSpacing: 1, marginBottom: 10 }}
              >{closing === 'force_voting' ? '...' : 'MOVE TO VOTING NOW'}</button>
            )}
            {bet.status === 'voting' && (
              <button
                onClick={() => doClose('finalize', 'Finalize this bet using current votes (' + votes.length + ')?')}
                disabled={closing !== null}
                style={{ width: '100%', padding: 14, borderRadius: 12, cursor: 'pointer', background: 'rgba(0,255,224,0.1)', border: '1px solid var(--teal)', color: 'var(--teal)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, letterSpacing: 1, marginBottom: 10 }}
              >{closing === 'finalize' ? '...' : 'FINALIZE WITH ' + votes.length + ' VOTES'}</button>
            )}
            <button
              onClick={() => doClose('nullify', 'Nullify this bet? No winners. Cannot be undone.')}
              disabled={closing !== null}
              style={{ width: '100%', padding: 14, borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid var(--text-faint)', color: 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, letterSpacing: 1 }}
            >{closing === 'nullify' ? '...' : 'NULLIFY BET'}</button>
            {closeError && <p style={{ color: 'var(--pink)', fontSize: 12, marginTop: 10 }}>{closeError}</p>}
          </div>
        )}
      </div>
      <BottomNav />
      {fundsModal && (
        <div onClick={() => setFundsModal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: 20, padding: 24, maxWidth: 340, width: '100%',
            border: '1px solid var(--border)', textAlign: 'center'
          }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: 'var(--pink)', letterSpacing: 2, marginBottom: 8 }}>
              ADD FUNDS
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.4 }}>
              You need <span style={{ color: 'var(--teal)', fontWeight: 600 }}>${fundsModal.needed}</span> USDC to join this bet.<br/>
              Your balance: <span style={{ color: 'var(--text)' }}>${fundsModal.balance.toFixed(2)}</span>
            </p>
            <a href={fundsModal.onramp_url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', padding: '14px 24px', borderRadius: 12,
                background: 'linear-gradient(135deg, var(--pink), #FF6FA0)',
                color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, letterSpacing: 2,
                textDecoration: 'none', marginBottom: 10,
                boxShadow: '0 6px 20px rgba(255,31,107,0.4)'
              }}>
              ADD FUNDS WITH APPLE PAY
            </a>
            <button onClick={() => setFundsModal(null)} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, padding: 8, cursor: 'pointer'
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
