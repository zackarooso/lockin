'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirect') || '/'
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [rawPhone, setRawPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function fmtPhone(val) {
    const d = val.replace(/\D/g, '')
    setRawPhone(d)
    if (d.length <= 3) return d
    if (d.length <= 6) return '(' + d.slice(0,3) + ') ' + d.slice(3)
    return '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6,10)
  }

  async function submitPhone() {
    if (rawPhone.length < 10) { setError('Invalid phone number'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone })
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Error'); return }
    if (data.isNew || !data.user.display_name) setStep('name')
    else router.replace(redirectTo)
  }

  async function submitName() {
    if (!name.trim()) { setError('Enter a name'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: rawPhone, display_name: name.trim() })
    })
    setLoading(false)
    if (res.ok) router.replace(redirectTo)
    else { const d = await res.json(); setError(d.error || 'Error') }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
      <div style={{ fontSize: 72, marginBottom: 8, animation: 'flamingo-bob 3s ease-in-out infinite' }}>🦩</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 72, letterSpacing: 6, background: 'linear-gradient(135deg, #FF0055, #FF1F6B, #00FFE0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 8 }}>LOCK IN</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: redirectTo !== '/' ? 16 : 40, textAlign: 'center' }}>put money on it. let your friends judge you.</div>

      {redirectTo !== '/' && (
        <div style={{ background: 'rgba(0,255,224,0.08)', border: '1px solid rgba(0,255,224,0.3)', borderRadius: 12, padding: '10px 16px', marginBottom: 28, textAlign: 'center', fontSize: 13, color: 'var(--teal)' }}>
          You have been challenged. Sign up to join the bet.
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 320 }}>
        {step === 'phone' ? (
          <>
            <label className="form-label">Your Phone Number</label>
            <input className="form-input" type="tel" value={phone} placeholder="(310) 867-5309" maxLength={14} autoFocus
              onChange={e => setPhone(fmtPhone(e.target.value))}
              onKeyDown={e => e.key === 'Enter' && submitPhone()}
              style={{ fontSize: 20, fontFamily: 'Bebas Neue, sans-serif', letterSpacing: 2, marginBottom: 8 }} />
            <p style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 20, textAlign: 'center' }}>No password. No SMS. Just your number.</p>
            {error && <p style={{ color: 'var(--pink)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
            <button className="btn-primary" onClick={submitPhone} disabled={loading}>{loading ? '...' : 'LOCK IN'}</button>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 24, color: 'var(--text)', letterSpacing: 1 }}>What do they call you?</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>This shows up on your bets.</p>
            </div>
            <label className="form-label">Your Name</label>
            <input className="form-input" type="text" value={name} placeholder="Big Spender" autoFocus autoCapitalize="words"
              style={{ marginBottom: 20 }}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitName()} />
            {error && <p style={{ color: 'var(--pink)', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>}
            <button className="btn-primary" onClick={submitName} disabled={loading}>{loading ? '...' : 'LETS GO'}</button>
            <button className="btn-ghost" onClick={() => setStep('phone')} style={{ marginTop: 10 }}>wrong number?</button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🦩</div>}>
      <AuthInner />
    </Suspense>
  )
}