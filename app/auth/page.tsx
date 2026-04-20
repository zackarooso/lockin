'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [step, setStep] = useState<'phone'|'name'>('phone')
  const [phone, setPhone] = useState('')
  const [rawPhone, setRawPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 10)
    setRawPhone(digits)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return '(' + digits.slice(0,3) + ') ' + digits.slice(3)
    return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6)
  }

  async function handlePhone() {
    if (rawPhone.length < 10) { setError('Enter a valid 10-digit number'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); setLoading(false); return }
      if (data.isNew || !data.user.display_name) { setStep('name') }
      else { router.replace(redirectTo) }
    } catch(e) { setError('Connection error') }
    setLoading(false)
  }

  async function handleName() {
    if (!name.trim()) { setError('Enter your name'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawPhone, display_name: name.trim() })
      })
      if (res.ok) { router.replace(redirectTo) }
      else { const d = await res.json(); setError(d.error || 'Something went wrong') }
    } catch(e) { setError('Connection error') }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>🦩</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 80, letterSpacing: 6, background: 'linear-gradient(135deg, #FF0055, #FF1F6B, #FF6FA0, #00FFE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 0.9, marginBottom: 8 }}>LOCK IN</div>
      <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 14, color: 'rgba(255,31,107,0.7)', marginBottom: redirectTo !== '/' ? 20 : 40, textAlign: 'center' }}>
        put money on it. let your friends judge you.
      </div>
      {redirectTo !== '/' && (
        <div style={{ background: 'rgba(0,255,224,0.08)', border: '1px solid rgba(0,255,224,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 24, textAlign: 'center', fontSize: 13, color: 'var(--teal)', maxWidth: 300 }}>
          You have been challenged - sign up to join the bet
        </div>
      )}
      <div style={{ width: '100%', maxWidth: 320 }}>
        {step === 'phone' && (
          <>
            <label className="form-label">Your Phone Number</label>
            <input className="form-input" type="tel" value={phone} placeholder="(555) 867-5309" maxLength={14} autoFocus
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handlePhone()}
              style={{ fontSize: 22, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 20, textAlign: 'center' }}>No password. No SMS. Just your number.</p>
            {error && <p style={{ color: '#FF1F6B', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
            <button className="btn-primary" onClick={handlePhone} disabled={loading}>{loading ? '...' : 'LOCK IN'}</button>
          </>
        )}
        {step === 'name' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--text)', letterSpacing: 1 }}>What do they call you?</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>This shows up on your bets.</p>
            </div>
            <label className="form-label">Your Name</label>
            <input className="form-input" type="text" value={name} placeholder="Big Spender" autoFocus autoCapitalize="words"
              style={{ marginBottom: 20 }}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleName()} />
            {error && <p style={{ color: '#FF1F6B', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
            <button className="btn-primary" onClick={handleName} disabled={loading}>{loading ? '...' : "LET'S GO"}</button>
            <button className="btn-ghost" onClick={() => { setStep('phone'); setError('') }} style={{ marginTop: 10 }}>Wrong number?</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, color: 'var(--pink)' }}>LOCK IN</div></div>}>
      <AuthInner />
    </Suspense>
  )
}