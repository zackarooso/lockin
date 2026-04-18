'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [rawPhone, setRawPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatPhone(val: string) {
    const digits = val.replace(/\D/g, '')
    setRawPhone(digits)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return '(' + digits.slice(0,3) + ') ' + digits.slice(3)
    return '(' + digits.slice(0,3) + ') ' + digits.slice(3,6) + '-' + digits.slice(6,10)
  }

  async function handlePhone() {
    if (rawPhone.length < 10) { setError("That number ain't right chief"); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    if (data.isNew || !data.user.display_name) setStep('name')
    else router.replace(redirectTo)
  }

  async function handleName() {
    if (!displayName.trim()) { setError('Give us a name'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone, display_name: displayName.trim() }),
    })
    setLoading(false)
    if (res.ok) router.replace(redirectTo)
    else { const d = await res.json(); setError(d.error) }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', right: '-20%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,31,107,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ fontSize: 80, marginBottom: 8, animation: 'flamingo-bob 3s ease-in-out infinite', filter: 'drop-shadow(0 0 30px rgba(255,31,107,0.5))' }}></div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 80, letterSpacing: 6, background: 'linear-gradient(135deg, #FF0055, #FF1F6B, #FF6FA0, #00FFE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 0.9, marginBottom: 4 }}>LOCK IN</div>
      <div style={{ fontFamily: 'Permanent Marker, cursive', fontSize: 15, color: 'rgba(255,31,107,0.7)', marginBottom: redirectTo !== '/' ? 16 : 48, transform: 'rotate(-2deg)', textAlign: 'center', lineHeight: 1.4 }}>
        put money on it. let your friends judge you.
      </div>
      {redirectTo !== '/' && (
        <div style={{ background: 'rgba(0,255,224,0.08)', border: '1px solid rgba(0,255,224,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 28, textAlign: 'center', fontSize: 13, color: 'var(--teal)' }}>
          You have been challenged  sign up to join the bet
        </div>
      )}
      <div style={{ width: '100%', maxWidth: 320 }}>
        {step === 'phone' && (
          <>
            <label className="form-label">Your Phone Number</label>
            <input className="form-input" type="tel" value={phone} placeholder="(305) 867-5309" maxLength={14} autoFocus
              onChange={e => setPhone(formatPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && handlePhone()}
              style={{ fontSize: 22, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 20, textAlign: 'center' }}>No password. No SMS. Just your number.</p>
            {error && <p style={{ color: '#FF1F6B', fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: 'Permanent Marker, cursive' }}>{error}</p>}
            <button className="btn-primary" onClick={handlePhone} disabled={loading}>{loading ? '...' : 'LOCK IN'}</button>
          </>
        )}
        {step === 'name' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}></div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--text)', marginBottom: 6, letterSpacing: 1 }}>What do they call you?</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This shows up on your bets.</p>
            </div>
            <label className="form-label">Your Name / Alias</label>
            <input className="form-input" type="text" value={displayName} placeholder="Big Spender" autoFocus autoCapitalize="words"
              style={{ marginBottom: 20 }}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleName()} />
            {error && <p style={{ color: '#FF1F6B', fontSize: 13, marginBottom: 12, textAlign: 'center', fontFamily: 'Permanent Marker, cursive' }}>{error}</p>}
            <button className="btn-primary" onClick={handleName} disabled={loading}>{loading ? '...' : "LETS GO"}</button>
            <button className="btn-ghost" onClick={() => setStep('phone')} style={{ marginTop: 10 }}>wrong number?</button>
          </>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontFamily: 'Permanent Marker, cursive', fontSize: 10, color: 'var(--text-faint)', letterSpacing: 1 }}>
        no actual gambling
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 48 }}></div>
      </div>
    }>
      <AuthInner />
    </Suspense>
  )
}