'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function CreateBet() {
  const router = useRouter()
  const [aboutSelf, setAboutSelf] = useState(true)
  const [friendName, setFriendName] = useState('')
  const [friendPhone, setFriendPhone] = useState('')
  const [text, setText] = useState('')
  const [stake, setStake] = useState('')
  const [joinDeadline, setJoinDeadline] = useState('')
  const [endTime, setEndTime] = useState('')
  const [proofPhoto, setProofPhoto] = useState(false)
  const [proofVideo, setProofVideo] = useState(false)
  const [proofGeo, setProofGeo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function stakeLabel(amt) {
    const n = parseFloat(amt)
    if (!n) return 'how much?'
    if (n < 5) return 'pocket change'
    if (n < 20) return 'light stakes'
    if (n < 50) return 'getting serious'
    if (n < 100) return 'big energy'
    return 'ferrari energy right here'
  }

  async function submit() {
    if (!text.trim()) { setError('What is the bet?'); return }
    if (!stake || parseFloat(stake) <= 0) { setError('How much?'); return }
    if (!joinDeadline || !endTime) { setError('Set the deadlines'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/bets/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        about_self: aboutSelf,
        friend_name: friendName,
        friend_phone: friendPhone,
        text: text.trim(),
        stake_amount: parseFloat(stake),
        join_deadline: new Date(joinDeadline).toISOString(),
        end_time: new Date(endTime).toISOString(),
        proof_photo: proofPhoto,
        proof_video: proofVideo,
        proof_geolocation: proofGeo,
      })
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) router.push('/bet/' + data.bet.id)
    else setError(data.error || 'Failed to create bet')
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0,16)
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0,16)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 100 }}>
      <div className="header">
        <div className="logo">LOCK IN</div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 10, color: 'var(--pink)', textAlign: 'right', lineHeight: 1.3 }}>PUT $$ ON IT<br />LET EM JUDGE U</div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 2, color: 'var(--text)', marginBottom: 20 }}>NEW BET</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[true, false].map(val => (
            <button key={String(val)} onClick={() => setAboutSelf(val)}
              style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: '1px solid ' + (aboutSelf === val ? 'var(--pink)' : 'var(--border)'), background: aboutSelf === val ? 'rgba(255,31,107,0.1)' : 'var(--surface)', color: aboutSelf === val ? 'var(--pink)' : 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 14, letterSpacing: 1, cursor: 'pointer' }}>
              {val ? 'SELF BET' : 'ABOUT A FRIEND'}
            </button>
          ))}
        </div>

        {!aboutSelf && (
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Friend Name</label>
            <input className="form-input" type="text" value={friendName} placeholder="Big Butt Dong Lee" onChange={e => setFriendName(e.target.value)} style={{ marginBottom: 10 }} />
            <label className="form-label">Friend Phone (optional)</label>
            <input className="form-input" type="tel" value={friendPhone} placeholder="(310) 555-0100" onChange={e => setFriendPhone(e.target.value)} />
          </div>
        )}

        <label className="form-label">The Bet</label>
        <textarea className="form-input" value={text} placeholder={aboutSelf ? 'I will do 100 pushups before midnight...' : 'They will show up on time for once...'} rows={3}
          onChange={e => setText(e.target.value)}
          style={{ resize: 'none', marginBottom: 20 }} />

        <label className="form-label">Stake ($)</label>
        <input className="form-input" type="number" value={stake} placeholder="20" min="1"
          onChange={e => setStake(e.target.value)} style={{ marginBottom: 4 }} />
        <div style={{ fontSize: 11, color: 'var(--pink)', fontFamily: 'Permanent Marker, cursive', marginBottom: 16 }}>{stakeLabel(stake)}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div>
            <label className="form-label">Join By</label>
            <input className="form-input" type="datetime-local" value={joinDeadline} min={tomorrow} onChange={e => setJoinDeadline(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Ends</label>
            <input className="form-input" type="datetime-local" value={endTime} min={tomorrow} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 10 }}>PROOF REQUIRED</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['proofPhoto', 'PHOTO', proofPhoto, setProofPhoto], ['proofVideo', 'VIDEO', proofVideo, setProofVideo], ['proofGeo', 'LOCATION', proofGeo, setProofGeo]].map(([key, label, val, setter]) => (
              <button key={String(key)} onClick={() => setter(!val)}
                style={{ padding: '8px 14px', borderRadius: 99, border: '1px solid ' + (val ? 'var(--teal)' : 'var(--border)'), background: val ? 'rgba(0,255,224,0.1)' : 'var(--surface)', color: val ? 'var(--teal)' : 'var(--text-muted)', fontFamily: 'Bebas Neue, sans-serif', fontSize: 12, letterSpacing: 1, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <p style={{ color: 'var(--pink)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
        <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? '...' : 'LOCK IT IN'}</button>
      </div>
      <BottomNav active="create" />
    </div>
  )
}