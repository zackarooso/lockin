'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const router = useRouter()
  const [subject, setSubject] = useState<'me' | 'friend'>('me')
  const [friendName, setFriendName] = useState('')
  const [friendPhone, setFriendPhone] = useState('')
  const [betText, setBetText] = useState('')
  const [creatorSide, setCreatorSide] = useState<'yes' | 'no'>('yes')
  const [stake, setStake] = useState('')
  const [joinDeadline, setJoinDeadline] = useState(daysFromNow(1))
  const [endTime, setEndTime] = useState(daysFromNow(7))
  const [proof, setProof] = useState<Set<string>>(new Set(['none']))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleProof(type: string) {
    const next = new Set(proof)
    if (type === 'none') { next.clear(); next.add('none') }
    else {
      next.delete('none')
      next.has(type) ? next.delete(type) : next.add(type)
      if (next.size === 0) next.add('none')
    }
    setProof(next)
  }

  async function handleCreate() {
    if (!betText.trim()) { setError('Write the bet first chief'); return }
    if (!stake || parseFloat(stake) <= 0) { setError('What are you betting, your feelings?'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/bets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about_self: subject === 'me',
        friend_name: friendName,
        friend_phone: friendPhone,
        text: betText,
        creator_side: subject === 'me' ? 'yes' : creatorSide,
        stake_amount: parseFloat(stake),
        join_deadline: joinDeadline,
        end_time: endTime,
        proof_photo: proof.has('photo'),
        proof_video: proof.has('video'),
        proof_geolocation: proof.has('geo'),
      }),
    })

    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Something went wrong'); return }
    router.replace('/')
  }

  return (
    <div className="screen-pad" style={{ paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: 'Bebas Neue, sans-serif', fontSize: 48,
          letterSpacing: 2, lineHeight: 0.9,
          background: 'linear-gradient(135deg, #FF0055, #FF6FA0)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Create<br/>A Bet</div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 12, color: 'var(--text-muted)', marginTop: 6, transform: 'rotate(-1deg)'}}>
          make it spicy 
        </div>
      </div>

      {/* About me / friend */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">This bet is about</label>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <SubjectBtn label="Me" sub="I'm the subject" active={subject === 'me'} onClick={() => setSubject('me')} />
          <SubjectBtn label="A Friend" sub="they're the subject" active={subject === 'friend'} onClick={() => setSubject('friend')} />
        </div>
      </div>

      {subject === 'friend' && (
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px', marginBottom: 20,
        }}>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Friend's name</label>
            <input className="form-input" placeholder="Big Mike" value={friendName} onChange={e => setFriendName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Friend's phone (so we know who they are)</label>
            <input className="form-input" type="tel" placeholder="(305) 000-1234" value={friendPhone} onChange={e => setFriendPhone(e.target.value)} />
          </div>
        </div>
      )}

      {/* The bet */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">The Bet</label>
        <textarea
          className="form-input"
          placeholder={subject === 'me'
            ? "I will not text my ex for 30 days"
            : "Mike will actually show up to the gym this week"}
          value={betText}
          onChange={e => setBetText(e.target.value)}
          style={{ minHeight: 90 }}
        />
        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 4, fontFamily: 'Permanent Marker, cursive' }}>
          be specific. be petty. be legendary.
        </div>
      </div>

      {/* Creator side — only if about friend */}
      {subject === 'friend' && (
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">I'm betting they will...</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <SideBtn label="YES" sub="they'll do it" active={creatorSide === 'yes'} color="teal" onClick={() => setCreatorSide('yes')} />
            <SideBtn label="NO" sub="they won't" active={creatorSide === 'no'} color="pink" onClick={() => setCreatorSide('no')} />
          </div>
        </div>
      )}

      {/* Stake */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label">Stake Amount </label>
        <div style={{ position:'relative' }}>
          <span style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: 'var(--pink)',
          }}>$</span>
          <input
            className="form-input"
            type="number"
            placeholder="50"
            min="1"
            value={stake}
            onChange={e => setStake(e.target.value)}
            style={{ paddingLeft: 32, fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 1 }}
          />
        </div>
        {stake && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            {getStakeComment(parseFloat(stake))}
          </div>
        )}
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label className="form-label">Join by</label>
          <input className="form-input" type="datetime-local" value={joinDeadline} onChange={e => setJoinDeadline(e.target.value)} style={{ fontSize: 12 }} />
        </div>
        <div>
          <label className="form-label">Bet ends</label>
          <input className="form-input" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ fontSize: 12 }} />
        </div>
      </div>

      {/* Proof */}
      <div style={{ marginBottom: 28 }}>
        <label className="form-label">Required Proof </label>
        <div style={{ display:'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { key: 'none',  icon: '', label: 'None',      sub: 'honor system lol' },
            { key: 'photo', icon: '', label: 'Photo',     sub: 'pics or it didnt happen' },
            { key: 'video', icon: '', label: 'Video',     sub: 'full receipts' },
            { key: 'geo',   icon: '', label: 'Location',  sub: 'gps don\'t lie' },
          ].map(({ key, icon, label, sub }) => (
            <button key={key} onClick={() => toggleProof(key)} style={{
              background: proof.has(key) ? 'var(--pink-dim)' : 'var(--surface-2)',
              border: `1px solid ${proof.has(key) ? 'rgba(255,31,107,0.5)' : 'var(--border)'}`,
              borderRadius: 12, padding: '12px 10px',
              color: proof.has(key) ? 'var(--pink)' : 'var(--text-muted)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all var(--transition)',
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 9, opacity: 0.6, fontFamily: 'Permanent Marker, cursive' }}>{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'var(--red-dim)', border: '1px solid rgba(232,0,13,0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          color: '#FF4444', fontSize: 13, fontFamily: 'Permanent Marker, cursive',
          textAlign: 'center',
        }}>{error}</div>
      )}

      <button className="btn-primary" onClick={handleCreate} disabled={loading} style={{ fontSize: 26, padding: 20 }}>
        {loading ? 'Locking in...' : 'LOCK IT IN'}
      </button>
    </div>
  )
}

function SubjectBtn({ label, sub, active, onClick }: { label: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--pink-dim)' : 'var(--surface)',
      border: `2px solid ${active ? 'var(--pink)' : 'var(--border)'}`,
      borderRadius: 14, padding: '14px 12px', cursor: 'pointer',
      textAlign: 'center', transition: 'all var(--transition)',
      boxShadow: active ? '0 0 20px var(--pink-dim)' : 'none',
    }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: active ? 'var(--pink)' : 'var(--text)', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Permanent Marker, cursive', marginTop: 2 }}>{sub}</div>
    </button>
  )
}

function SideBtn({ label, sub, active, color, onClick }: { label: string; sub: string; active: boolean; color: 'teal' | 'pink'; onClick: () => void }) {
  const c = color === 'teal' ? 'var(--teal)' : 'var(--pink)'
  const bg = color === 'teal' ? 'var(--teal-dim)' : 'var(--pink-dim)'
  return (
    <button onClick={onClick} style={{
      background: active ? bg : 'var(--surface)',
      border: `2px solid ${active ? c : 'var(--border)'}`,
      borderRadius: 14, padding: '14px 12px', cursor: 'pointer',
      textAlign: 'center', transition: 'all var(--transition)',
    }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: active ? c : 'var(--text)', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Permanent Marker, cursive', marginTop: 2 }}>{sub}</div>
    </button>
  )
}

function getStakeComment(amount: number) {
  if (amount < 5)   return 'bet with peanuts, win peanuts'
  if (amount < 20)  return 'okay... modest energy'
  if (amount < 50)  return 'now we\'re talking'
  if (amount < 100) return 'SERIOUS commitment'
  if (amount < 500) return '️ ferrari energy right here'
  return 'absolute MANIAC. respect.'
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 16)
}
