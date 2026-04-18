'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function VotePage() {
  const router = useRouter()
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch(`/api/bets/${id}`)
      .then(r => { if (!r.ok) router.replace('/'); return r.json() })
      .then(setData)
  }, [id])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2200) }

  async function castVote(vote: string) {
    setSelected(vote)
    setLoading(true)
    const res = await fetch('/api/bets/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet_id: parseInt(id as string), vote }),
    })
    setLoading(false)
    if (res.ok) {
      const msgs: any = { yes: 'Voted YES ✓ bold move', no: 'Voted NO ✗ cold blooded', nullify: 'Nullified 🤷 coward' }
      showToast(msgs[vote])
      setTimeout(() => router.replace('/'), 1400)
    } else {
      const d = await res.json()
      showToast(d.error || 'Vote failed')
      setSelected(null)
    }
  }

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70dvh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 40, animation: 'flamingo-bob 1.5s ease-in-out infinite' }}>🦩</div>
    </div>
  )

  const { bet, proofs, currentUserId } = data
  const isSubject = bet.subject_user_id === currentUserId
  const yesPool = bet.participants?.filter((p: any) => p.side === 'yes').reduce((s: number, p: any) => s + p.amount, 0) || 0
  const noPool  = bet.participants?.filter((p: any) => p.side === 'no').reduce((s: number, p: any) => s + p.amount, 0) || 0

  if (isSubject) return (
    <div className="screen-pad" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🙈</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: 'var(--text)', marginBottom: 8 }}>
        You can't vote on yourself
      </div>
      <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 14, color: 'var(--text-muted)' }}>
        that would be cheating bestie
      </div>
    </div>
  )

  return (
    <div className="screen-pad" style={{ paddingBottom: 60 }}>
      {toast && <div className="toast show">{toast}</div>}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 44, letterSpacing: 2, lineHeight: 0.9, marginBottom: 6 }}>
          <span style={{ background: 'linear-gradient(135deg, var(--gold), #FFB800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your Verdict
          </span>
        </div>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 12, color: 'var(--text-muted)', transform: 'rotate(-1deg)' }}>
          choose wisely. or don't.
        </div>
      </div>

      {/* Bet recap */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 20, marginBottom: 20,
      }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 8 }}>The Bet</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12 }}>{bet.text}</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: 'var(--teal)' }}>${yesPool}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>YES pool</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: 'var(--pink)' }}>${noPool}</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>NO pool</div>
          </div>
        </div>
      </div>

      {/* Proof */}
      {proofs?.length > 0 ? (
        <div style={{ marginBottom: 20 }}>
          <div className="section-label">📎 Evidence</div>
          {proofs.map((p: any) => (
            <div key={p.id} style={{ marginBottom: 10 }}>
              {p.photo_url && <img src={p.photo_url} alt="proof" style={{ width: '100%', borderRadius: 14, objectFit: 'cover', maxHeight: 240, border: '1px solid var(--border)' }} />}
              {p.video_url && <video src={p.video_url} controls style={{ width: '100%', borderRadius: 14 }} />}
              {p.latitude && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: 'var(--text)' }}>
                  📍 {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  <a href={`https://maps.google.com/?q=${p.latitude},${p.longitude}`} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', marginLeft: 8, textDecoration: 'none', fontSize: 11 }}>Map →</a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--surface-2)', border: '1px dashed rgba(255,31,107,0.2)',
          borderRadius: 14, padding: 24, marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🕵️</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No proof submitted yet</div>
          <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
            judge based on vibes
          </div>
        </div>
      )}

      {/* Vote buttons */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, textAlign: 'center' }}>
          did {bet.subject?.display_name || 'they'} actually do it?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <VoteBtn
            label="✓ YES" sub="they followed through, legend"
            vote="yes" selected={selected} disabled={loading}
            color="var(--teal)" bg="var(--teal-dim)" border="rgba(0,255,224,0.4)"
            onClick={castVote}
          />
          <VoteBtn
            label="✗ NO" sub="nope. not even close."
            vote="no" selected={selected} disabled={loading}
            color="var(--pink)" bg="var(--pink-dim)" border="rgba(255,31,107,0.4)"
            onClick={castVote}
          />
          <VoteBtn
            label="— NULLIFY" sub="can't tell. no receipts."
            vote="nullify" selected={selected} disabled={loading}
            color="var(--text-muted)" bg="var(--white-dim)" border="var(--border)"
            onClick={castVote}
          />
        </div>
      </div>

      <p style={{ fontSize: 10, color: 'var(--text-faint)', textAlign: 'center', lineHeight: 1.7, fontFamily: 'Permanent Marker, cursive' }}>
        majority wins · ties = nullified · the subject can't vote
      </p>
    </div>
  )
}

function VoteBtn({ label, sub, vote, selected, disabled, color, bg, border, onClick }: any) {
  const active = selected === vote
  return (
    <button onClick={() => onClick(vote)} disabled={disabled} style={{
      width: '100%', padding: '18px 20px', textAlign: 'left',
      background: active ? bg : 'var(--surface)',
      border: `2px solid ${active ? border : 'var(--border)'}`,
      borderRadius: 16, cursor: disabled ? 'default' : 'pointer',
      transition: 'all 220ms cubic-bezier(0.16,1,0.3,1)',
      transform: active ? 'scale(1.02)' : 'scale(1)',
      boxShadow: active ? `0 4px 20px ${bg}` : 'none',
    }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, letterSpacing: 1.5, color: active ? color : 'var(--text-muted)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 11, color: active ? color : 'var(--text-faint)', marginTop: 2, opacity: 0.8 }}>
        {sub}
      </div>
    </button>
  )
}
