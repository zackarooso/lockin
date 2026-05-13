import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'
import { getBetById, addParticipant, updateBetStatus, initDb, getUserWallet } from '@/lib/db'
import { getUSDCBalance, getOnrampUrl } from '@/lib/privy'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const session = await getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { bet_id, side, amount } = await req.json()
    const bet = await getBetById(bet_id)
    if (!bet) return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    if (bet.status !== 'open') return NextResponse.json({ error: 'Bet closed' }, { status: 400 })
    if (new Date(bet.join_deadline) < new Date()) return NextResponse.json({ error: 'Deadline passed' }, { status: 400 })
    if (bet.subject_user_id === session.userId) return NextResponse.json({ error: 'Subject cannot join' }, { status: 400 })

    // Check wallet balance before allowing join
    const wallet = await getUserWallet(session.userId)
    if (wallet?.wallet_address) {
      const balance = await getUSDCBalance(wallet.wallet_address)
      if (balance < amount) {
        return NextResponse.json({
          error: 'insufficient_funds',
          needed: amount,
          balance,
          onramp_url: getOnrampUrl(wallet.wallet_address, Math.max(amount, 20))
        }, { status: 402 })
      }
    }

    const r = await addParticipant(bet_id, session.userId, side, amount)
    if (!r.changes) return NextResponse.json({ error: 'Already joined' }, { status: 400 })
    await updateBetStatus(bet_id, 'active')
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
