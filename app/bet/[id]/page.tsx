'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function BetDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [joinSide, setJoinSide] = useState<'yes' | 'no' | null>(null)
  const [joinStake, setJoinStake] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    const res = await fetch(`/api/bets/${id}`)
    if (res.status === 401) { router.replace('/auth'); return }
    if (!res.ok) { router.replace('/'); return }
    setData(await res.json())
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2200) }

  async function handleJoin() {
    if (!joinSide) { showToast('Pick a side first '); return }
    if (!joinStake || parseFloat(joinStake) <= 0) { showToast('Enter your stake '); return }
    setLoading(true)
    const res = await fetch('/api/bets/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_id: parseInt(id as string), side: joinSide, amount: parseFloat(joinStake) }),
    })
    setLoading(false)
    if (res.ok) { showToast("You're in! "); load() }
    else { const d = await res.json(); showToast(d.error || 'Failed') }
  }

  if (!data) return <Loader />

  const { bet, votes, proofs, currentUserId } = data
  const isParticipant = bet.participants?.some((p: any) => p.user_id === currentUserId)
  const isCreator = bet.creator_user_id === currentUserId
  const isSubject = bet.subject_user_id === currentUserId
  const myP = bet.participants?.find((p: any) => p.user_id === currentUserId)
  const mySide = myP?.side || (isCreator ? bet.creator_side : null)

  const joinDeadlinePassed = new Date(bet.join_deadline) < new Date()
  const endTimePassed = new Date(bet.end_time) < new Date()
  const canJoin = !isParticipant && !isCreator && !joinDeadlinePassed && bet.status === 'open'
  const canVote = (bet.status === 'voting' || endTimePassed) && !isSubject

  const yesPool = bet.participants?.filter((p: any) => p.side === 'yes').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0
  const noPool  = bet.participants?.filter((p: any) => p.side === 'no').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0
  const total = yesPool + noPool || 1
  const yesPct = Math.round(yesPool / total * 100)

  return (
    <div className="screen-pad" style={{ paddingBottom: 60 }}>
      {toast && <div className="toast show">{toast}</div>}

      {/* Status badge */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <StatusBadge status={bet.status} winningSide={bet.winning_side} />
        {mySide && <span className={`side-badge ${mySide === 'yes' ? 'side-yes' : 'side-no'}`}>YOU: {mySide.toUpperCase()}</span>}
      </div>

      {/* Bet text */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255,31,107,0.06) 100%)',
        border: '1px solid rgba(255,31,107,0.2)',
        borderRadius: 20, padding: '20px',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        {/* Racing stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: 'linear-gradient(to bottom, var(--pink), var(--red))' }} />
        <div style={{ paddingLeft: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {bet.about_self ? ' Self bet' : ` About ${bet.subject?.display_name || 'someone'}`}
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 16 }}>
            {bet.text}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip icon="" label={`$${bet.stake_amount} stake`} />
            {bet.proof_photo && <Chip icon="" label="Photo" />}
            {bet.proof_video && <Chip icon="" label="Video" />}
            {bet.proof_geolocation && <Chip icon="" label="Location" />}
          </div>
        </div>
      </div>

      {/* Pool */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <PoolStat label="YES Pool" amount={yesPool} pct={yesPct} color="var(--teal)" />
          <div style={{ width: 1, background: 'var(--border)' }} />
          <PoolStat label="NO Pool" amount={noPool} pct={100 - yesPct} color="var(--pink)" />
        </div>
        <div className="pool-bar-track" style={{ height: 10 }}>
          <div className="pool-bar-fill" style={{ width: `${yesPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--teal)' }}>YES {yesPct}%</span>
          <span style={{ fontSize: 11, color: 'var(--pink)' }}>NO {100 - yesPct}%</span>
        </div>
      </div>

      {/* Participants */}
      {bet.participants?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">Who's in</div>
          {bet.participants.map((p: any) => (
            <div key={p.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid rgba(255,31,107,0.08)',
            }}>
              <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>
                {p.display_name || p.phone}
                {p.user_id === currentUserId && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>(you)</span>}
              </span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: 'var(--text-muted)' }}>${p.amount}</span>
                <span className={`side-badge ${p.side === 'yes' ? 'side-yes' : 'side-no'}`}>{p.side.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Proofs */}
      {proofs?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label"> Proof submitted</div>
          {proofs.map((p: any) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              {p.photo_url && <img src={p.photo_url} alt="proof" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 220 }} />}
              {p.video_url && <video src={p.video_url} controls style={{ width: '100%', borderRadius: 12 }} />}
              {p.latitude && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                   {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  <a href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', marginLeft: 8, textDecoration: 'none', fontSize: 11 }}>
                    View 
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Votes */}
      {votes?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">³¯¸ Votes ({votes.length})</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['yes', 'no', 'nullify'].map(v => {
              const count = votes.filter((vote: any) => vote.vote === v).length
              if (!count) return null
              return (
                <div key={v} style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '8px 14px', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: v === 'yes' ? 'var(--teal)' : v === 'no' ? 'var(--pink)' : 'var(--text-muted)' }}>{count}</div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>{v}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dates */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <DatePill label="Join by" date={bet.join_deadline} passed={joinDeadlinePassed} />
        <DatePill label="Ends" date={bet.end_time} passed={endTimePassed} />
      </div>

      {/* Invite link */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => {
            const url = `https://lockin-production-1278.up.railway.app/bet/${id}`
            navigator.clipboard?.writeText(url).then(() => showToast('Link copied!  Text it to your friends')).catch(() => showToast(url))
          }}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, cursor: 'pointer',
            background: 'var(--surface-2)', border: '1px solid rgba(0,255,224,0.3)',
            color: 'var(--teal)', fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 18, letterSpacing: 1,
          }}
        >
           Copy Invite Link
        </button>
      </div>

      {/* Join */}
      {canJoin && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 1, marginBottom: 16 }}>Join This Bet</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <SideJoinBtn label=" YES" active={joinSide === 'yes'} color="teal" onClick={() => setJoinSide('yes')} />
            <SideJoinBtn label=" NO" active={joinSide === 'no'} color="pink" onClick={() => setJoinSide('no')} />
          </div>
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: 'var(--pink)' }}>$</span>
            <input className="form-input" type="number" placeholder="Your stake" value={joinStake} onChange={e => setJoinStake(e.target.value)}
              style={{ paddingLeft: 30, fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: 1 }} />
          </div>
          <button className="btn-primary" onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining...' : "I'M IN "}
          </button>
        </div>
      )}

      {/* Vote CTA */}
      {canVote && (
        <Link href={`/bet/${id}/vote`} style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', padding: 20,
            background: 'linear-gradient(135deg, var(--gold), #FFB800)',
            border: 'none', borderRadius: 14,
            color: '#000', fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: 2,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,215,0,0.3)',
          }}>
             CAST YOUR VERDICT
          </button>
        </Link>
      )}

      {/* Settled result */}
      {bet.status === 'settled' && (
        <div style={{
          background: bet.winning_side === 'yes' ? 'rgba(0,255,224,0.08)' : 'var(--pink-dim)',
          border: `1px solid ${bet.winning_side === 'yes' ? 'rgba(0,255,224,0.3)' : 'rgba(255,31,107,0.3)'}`,
          borderRadius: 16, padding: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{bet.winning_side === 'yes' ? '¢' : '¢'}</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: bet.winning_side === 'yes' ? 'var(--teal)' : 'var(--pink)', letterSpacing: 1 }}>
            {bet.winning_side === 'yes' ? 'YES WON' : 'NO WON'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Settle up with your friends IRL </div>
        </div>
      )}

      {bet.status === 'nullified' && (
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}></div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--text-muted)', letterSpacing: 1 }}>NULLIFIED</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>{bet.nullified_reason || 'No winners this time'}</div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, winningSide }: { status: string; winningSide?: string }) {
  const map: any = {
    open:      { label: 'Open',      bg: 'rgba(0,255,224,0.12)',  color: 'var(--teal)' },
    active:    { label: '¥ Active', bg: 'rgba(255,31,107,0.12)', color: 'var(--pink)' },
    voting:    { label: '³¯¸ Voting', bg: 'rgba(255,215,0,0.12)',  color: 'var(--gold)' },
    settled:   { label: ` ${winningSide?.toUpperCase()} WON`, bg: 'rgba(0,255,224,0.08)', color: 'var(--teal)' },
    nullified: { label: '¢ Nullified', bg: 'var(--surface-2)', color: 'var(--text-muted)' },
  }
  const s = map[status] || map.open
  return (
    <span style={{ fontWeight: 700, letterSpacing: 1, padding: '4px 12px', borderRadius: 99, background: s.bg, color: s.color, fontFamily: 'Bebas Neue, sans-serif', fontSize: 13 }}>
      {s.label}
    </span>
  )
}
function Chip({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: 'var(--surface-3)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
      {icon} {label}
    </span>
  )
}
function PoolStat({ label, amount, pct, color }: any) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color, lineHeight: 1 }}>${amount}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</div>
    </div>
  )
}
function DatePill({ label, date, passed }: any) {
  return (
    <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: passed ? 'var(--pink)' : 'var(--text)', fontWeight: 500 }}>
        {new Date(date).toLocaleDateString()} {passed && '¢'}
      </div>
    </div>
  )
}
function SideJoinBtn({ label, active, color, onClick }: any) {
  const c = color === 'teal' ? 'var(--teal)' : 'var(--pink)'
  return (
    <button onClick={onClick} style={{
      padding: 16, borderRadius: 12, cursor: 'pointer',
      border: `2px solid ${active ? c : 'var(--border)'}`,
      background: active ? (color === 'teal' ? 'var(--teal-dim)' : 'var(--pink-dim)') : 'var(--surface-2)',
      color: active ? c : 'var(--text-muted)',
      fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, letterSpacing: 1,
      transition: 'all var(--transition)',
    }}>{label}</button>
  )
}
function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70dvh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40, animation: 'flamingo-bob 1.5s ease-in-out infinite' }}></div>
    </div>
  )
}
