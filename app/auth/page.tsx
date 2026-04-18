'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const router = useRouter()
  const from = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('from') : null
  const [step, setStep] = useState<'phone' | 'name'>('phone')
  const [phone, setPhone] = useState('')
  const [rawPhone, setRawPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isNew, setIsNew] = useState(false)

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, '')
    setRawPhone(digits)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6,10)}`
  }

  async function handlePhone() {
    if (rawPhone.length < 10) { setError('That number ain\'t right chief'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }

    if (data.isNew || !data.user.display_name) {
      setIsNew(true)
      setStep('name')
    } else {
      router.replace(from || '/')
    }
  }

  async function handleName() {
    if (!displayName.trim()) { setError('Give us a name'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone, display_name: displayName.trim() }),
    })
    setLoading(false)
    if (res.ok) router.replace(from || '/')
    else { const d = await res.json(); setError(d.error) }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-20%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,31,107,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', left: '-15%',
        width: 200, height: 200, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,255,224,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Big flamingo */}
      <div style={{
        fontSize: 80,
        marginBottom: 8,
        display: 'block',
        animation: 'flamingo-bob 3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 30px rgba(255,31,107,0.5))',
      }}>ð¦©</div>

      {/* Logo */}
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif',
        fontSize: 80, letterSpacing: 6,
        background: 'linear-gradient(135deg, #FF0055, #FF1F6B, #FF6FA0, #00FFE0)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: 0.9,
        marginBottom: 4,
        filter: 'drop-shadow(0 0 40px rgba(255,31,107,0.3))',
      }}>LOCK IN</div>

      {/* Tagline â Permanent Marker, chaotic */}
      <div style={{
        fontFamily: 'Permanent Marker, cursive',
        fontSize: 15,
        color: 'rgba(255,31,107,0.7)',
        marginBottom: 48,
        transform: 'rotate(-2deg)',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        put money on it.<br/>let your friends judge you. ð«µ
      </div>

      {/* Form */}
      <div style={{ width: '100%', maxWidth: 320 }}>
        {step === 'phone' && (
          <>
            <label className="form-label">Your digits</label>
            <input
              className="form-input"
              type="tel"
              value={phone}
              placeholder="(305) 867-5309"
              maxLength={14}
              autoFocus
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handlePhone()}
              style={{ fontSize: 22, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, marginBottom: 8 }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 20, textAlign: 'center' }}>
              No password. No SMS. Just your number. ð
            </p>
            {error && <p style={errStyle}>{error}</p>}
            <button className="btn-primary" onClick={handlePhone} disabled={loading}>
              {loading ? '...' : 'ð LOCK IN'}
            </button>
          </>
        )}

        {step === 'name' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>âï¸</div>
              <div style={{
                fontFamily: 'Bebas Neue, sans-serif', fontSize: 28,
                color: 'var(--text)', marginBottom: 6, letterSpacing: 1,
              }}>What do they call you?</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                This shows up on your bets.
              </p>
            </div>
            <label className="form-label">Your name / alias</label>
            <input
              className="form-input"
              type="text"
              value={displayName}
              placeholder="Big Spender"
              autoFocus
              autoCapitalize="words"
              style={{ marginBottom: 20 }}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleName()}
            />
            {error && <p style={errStyle}>{error}</p>}
            <button className="btn-primary" onClick={handleName} disabled={loading}>
              {loading ? '...' : "LET'S GO ð¦©"}
            </button>
            <button className="btn-ghost" onClick={() => setStep('phone')} style={{ marginTop: 10 }}>
              â wrong number?
            </button>
          </>
        )}
      </div>

      {/* Bottom decoration */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'Permanent Marker, cursive',
        fontSize: 10, color: 'var(--text-faint)',
        letterSpacing: 1,
      }}>
        ð° ð¦© ðï¸ no actual gambling
      </div>
    </div>
  )
}

const errStyle: React.CSSProperties = {
  color: '#FF1F6B', fontSize: 13, marginBottom: 12,
  textAlign: 'center', fontFamily: 'Permanent Marker, cursive',
}
