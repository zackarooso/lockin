'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

export default function HomePage() {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [walletInfo, setWalletInfo] = useState<any>(null)

  const load = useCallback(async () => {
    fetch('/api/wallet').then(r => r.json()).then(setWalletInfo).catch(() => {})
    const res = await fetch('/api/me')
    if (res.status === 401) { router.replace('/auth'); return }
    const d = await res.json()
    setData(d)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  if (loading) return <Loader />
  if (!data || !data.user) return <Loader />

  const user = data.user
  const bets = data.bets || []
  const ledger = data.ledger || []

  const net = ledger.reduce((s: number, e: any) => e.type === 'win' ? s + Number(e.amount) : e.type === 'loss' ? s - Number(e.amount) : s, 0)
  const wins = ledger.filter((e: any) => e.type === 'win').length
  const losses = ledger.filter((e: any) => e.type === 'loss').length

  const voting = bets.filter((b: any) => b.status === 'voting' && Number(b.subject_user_id) !== Number(user.id))
  const invites = bets.filter((b: any) => b.status === 'open' && Number(b.creator_user_id) !== Number(user.id) && !(b.participants || []).find((p: any) => Number(p.user_id) === Number(user.id)))
  const active = bets.filter((b: any) => b.status === 'active' || (b.status === 'open' && Number(b.creator_user_id) === Number(user.id)))
  const settled = bets.filter((b: any) => b.status === 'settled' || b.status === 'nullified')

  return (
    <>
    <div className="screen-pad">
      {/* Score strip */}
      <Link href="/scorecard" style={{ textDecoration: 'none' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, rgba(255,31,107,0.08) 100%)',
          border: '1px solid rgba(255,31,107,0.25)',
          borderRadius: 20,
          padding: '18px 20px',
          marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
            background: 'linear-gradient(to bottom, #FF0055, #FF6FA0)',
          }} />
          <div style={{ paddingLeft: 12 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 2 }}>
              Net Position
            </div>
            <div style={{
              fontFamily:'Bebas Neue, sans-serif', fontSize: 40,
              color: net >= 0 ? 'var(--teal)' : 'var(--pink)', lineHeight: 1,
              filter: net >= 0 ? 'drop-shadow(0 0 12px rgba(0,255,224,0.4))' : 'drop-shadow(0 0 12px rgba(255,31,107,0.4))',
            }}>
              {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(0)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              tap for full scorecard
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <MiniStat val={wins} label="WON" color="var(--teal)" />
            <MiniStat val={losses} label="LOST" color="var(--pink)" />
            <MiniStat val={bets.length} label="BETS" color="var(--white)" />
          </div>
        </div>
      </Link>

      {/* Wallet / Add Funds */}
      {walletInfo?.wallet_address && (
        <div style={{
          margin: '0 16px 16px', padding: '14px 16px', borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(0,255,224,0.08), rgba(255,31,107,0.08))',
          border: '1px solid rgba(0,255,224,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, fontFamily: 'Bebas Neue, sans-serif' }}>Wallet Balance</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--teal)', lineHeight: 1 }}>
              ${(walletInfo.balance || 0).toFixed(2)}
            </div>
          </div>
          {walletInfo.onramp_url && (
            <a href={walletInfo.onramp_url} target="_blank" rel="noopener noreferrer"
               style={{
                 padding: '10px 16px', borderRadius: 10,
                 background: 'linear-gradient(135deg, var(--pink), #FF6FA0)',
                 color: 'white', fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: 1.5,
                 textDecoration: 'none', display: 'inline-block',
                 boxShadow: '0 4px 14px rgba(255,31,107,0.4)'
               }}>
              + ADD FUNDS
            </a>
          )}
        </div>
      )}

      {/* Vote needed */}
      {voting.length > 0 && (
        <>
          <div className="section-label">vote needed ({voting.length})</div>
          {voting.map((b: any) => (
            <Link key={b.id} href={'/bet/' + b.id + '/vote'} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,31,107,0.06))',
                border: '1px solid rgba(255,215,0,0.35)',
                borderRadius: 16, padding: '16px 18px', marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Cast your verdict
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color:'var(--text)', lineHeight: 1.4 }}>{b.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      {(b.subject && b.subject.display_name) || 'someone'} · ${b.stake_amount}
                    </div>
                  </div>
                  <div style={{
                    background: 'var(--gold)', color: '#000',
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, letterSpacing: 1,
                    padding: '4px 10px', borderRadius: 99, whiteSpace: 'nowrap',
                  }}>VOTE NOW</div>
                </div>
              </div>
            </Link>
          ))}
        </>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <>
          <div className="section-label">invites ({invites.length})</div>
          {invites.map((b: any) => (
            <Link key={b.id} href={'/bet/' + b.id} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255,31,107,0.1), rgba(0,255,224,0.04))',
                border: '1px solid rgba(255,31,107,0.3)',
                borderRadius: 16, padding: '16px 18px', marginBottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{b.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    from {(b.creator && b.creator.display_name) || 'someone'} · ${b.stake_amount}
                  </div>
                </div>
                <div style={{
                  background: 'linear-gradient(135deg, #FF0055, #FF1F6B)',
                  color: '#fff', fontFamily: 'Bebas Neue, sans-serif',
                  fontSize: 14, letterSpacing: 1, padding: '6px 14px', borderRadius: 99,
                  boxShadow: '0 2px 12px rgba(255,31,107,0.4)',
                }}>JOIN</div>
              </div>
            </Link>
          ))}
        </>
      )}

      {/* Active bets */}
      {active.length > 0 && (
        <>
          <div className="section-label">active bets</div>
          {active.map((b: any) => <BetCard key={b.id} bet={b} userId={user.id} />)}
        </>
      )}

      {/* Settled */}
      {settled.length > 0 && (
        <>
          <div className="section-label" style={{ marginTop: 8 }}>settled</div>
          {settled.slice(0, 5).map((b: any) => (
            <Link key={b.id} href={'/bet/' + b.id} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 18px', marginBottom: 8, opacity: 0.7,
              }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{b.text}</div>
                <div style={{ fontSize: 11, color: b.status === 'nullified' ? 'var(--text-faint)' : b.winning_side === 'yes' ? 'var(--teal)' : 'var(--pink)' }}>
                  {b.status === 'nullified' ? 'Nullified' : b.winning_side === 'yes' ? 'YES won' : 'NO won'}
                </div>
              </div>
            </Link>
          ))}
        </>
      )}

      {bets.length === 0 && <EmptyState name={user.display_name} />}
    </div>
    <BottomNav />
    </>
  )
}

function BetCard({ bet, userId }: { bet: any; userId: number }) {
  const myP = (bet.participants || []).find((p: any) => Number(p.user_id) === Number(userId))
  const mySide = (myP && myP.side) || (Number(bet.creator_user_id) === Number(userId) ? bet.creator_side : null)
  const yesPool = (bet.participants || []).filter((p: any) => p.side === 'yes').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const noPool = (bet.participants || []).filter((p: any) => p.side === 'no').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const total = yesPool + noPool || 1
  const yesPct = Math.round(yesPool / total * 100)

  return (
    <Link href={'/bet/' + bet.id} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid ' + (mySide === 'yes' ? 'var(--teal)' : 'var(--pink)'),
        borderRadius: 16, marginBottom: 12, overflow: 'hidden',
        transition: 'transform var(--transition)',
      }}>
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {bet.about_self ? ((bet.subject && bet.subject.display_name) || 'someone') : (((bet.creator && bet.creator.display_name) || 'someone') + ' challenges')}
            </span>
            {mySide && (
              <span className={'side-badge ' + (mySide === 'yes' ? 'side-yes' : 'side-no')}>
                {mySide.toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, marginBottom: 12 }}>
            {bet.text}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 22,
              color: 'var(--text)', letterSpacing: 0.5,
            }}>
              ${bet.stake_amount} <span style={{ fontSize: 11, fontFamily: 'DM Sans', color: 'var(--text-muted)' }}>stake</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ends {new Date(bet.end_time).toLocaleDateString()}
            </span>
          </div>
          <div className="pool-bar-track">
            <div className="pool-bar-fill" style={{ width: yesPct + '%' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--teal)' }}>YES {yesPct}%</span>
            <span style={{ fontSize: 10, color: 'var(--pink)' }}>NO {100 - yesPct}%</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function MiniStat({ val, label, color }: { val: number; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

function EmptyState({ name }: { name: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16, animation: 'flamingo-bob 3s ease-in-out infinite' }}>{'\u{1F9A9}'}</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--text)', marginBottom: 8 }}>
        No bets yet, {name || 'champ'}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
        Hit the button and start some drama
      </div>
      <div style={{ fontFamily:'Permanent Marker, cursive', fontSize: 12, color: 'var(--text-faint)', transform: 'rotate(-1deg)' }}>
        your friends won't bet themselves
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80dvh', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 48, animation: 'flamingo-bob 1.5s ease-in-out infinite' }}>{'\u{1F9A9}'}</div>
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, color: 'var(--text-muted)', letterSpacing: 2 }}>LOADING THE DRAMA...</div>
    </div>
  )
}
